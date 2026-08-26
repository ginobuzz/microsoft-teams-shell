import { useState, useRef, useEffect } from 'react'
import MessageRow from './MessageRow'
import { contacts } from '../data'
import { IconButton, ChevronLeft, Close, Dots, Send, TypingIndicator } from './common'
import './ChannelThreadRail.css'

// Agent that jumps into a freshly-started channel thread — reuses Cowork
// ("Async collaboration and document workflows"). See DESIGN_GUIDE.md
// "Agent session tags" → "Channel threads". Hardcoded to a couple of scripted
// demo threads (see THREAD_SCRIPTS below) — not a general "any new thread"
// behavior.
const THREAD_AGENT_ID = 32
const THREAD_AGENT = contacts.find((c) => c.id === THREAD_AGENT_ID)

// Builds a short (<50 char) agent-tag pill label from the post's subject,
// e.g. "Tracking launch readiness".
function buildThreadTag(post) {
  const subject = (post.subject || '').replace(/[—–-].*$/, '').trim()
  const words = subject.split(/\s+/).filter(Boolean).slice(0, 4).join(' ')
  const tag = words ? `Tracking ${words}` : 'Tracking this thread'
  return tag.length > 49 ? `${tag.slice(0, 46)}…` : tag
}

// Matches "@Cowork" (case-insensitive) anywhere in a reply — this is what
// pulls the agent into the thread. Only the first mention is highlighted;
// good enough for a single-agent demo.
const MENTION_RE = /@cowork\b/i

// Splits reply text on the first @Cowork mention into MessageRow's mixed
// text shape (strings + `{ name }` mention parts), so it renders styled the
// same way as other mentions in the app.
function withMentionHighlight(text) {
  const match = text.match(MENTION_RE)
  if (!match || !THREAD_AGENT) return text
  const start = match.index
  const end = start + match[0].length
  const parts = []
  if (start > 0) parts.push(text.slice(0, start))
  parts.push({ name: `@${THREAD_AGENT.name}` })
  if (end < text.length) parts.push(text.slice(end))
  return parts
}

// ── Scripted per-post demo flows ───────────────────────────────────────────
// Each entry is a fully scripted back-and-forth, played automatically the
// first time the thread is opened (nothing to type). Steps alternate
// `from: 'me' | 'agent'` — an agent step shows the typing indicator first.
//
// `tag` on a step *sets* Cowork's thread-scoped label (its pending →
// resolved shimmer plays once, here). Every agent message after that — in
// this same thread — automatically carries that label forward (no re-decl
// needed) for the rest of the script. Each demo thread only sets one label,
// total, the moment Cowork commits to the task: one label per thread,
// naming the task Cowork is doing there, not a phase-by-phase status update.
// This mirrors a real "set a role label once, it applies to every message
// you post in this thread from then on" API: the label is stamped onto each
// message at send time, so already-rendered messages never change
// retroactively — only new ones pick up whatever label is currently active.
const THREAD_SCRIPTS = {
  // Handoff analytics thread: a plain "keep an eye on this" watch request.
  // Cowork asks a clarifying question before it tags itself, so the pill's
  // appearance reads as "I now have direction," not an instant reflex.
  'p25-3': [
    { from: 'me', text: `@${THREAD_AGENT?.name} can you keep an eye on this thread?`, delay: 1200 },
    {
      from: 'agent',
      text:
        "Sure — want me to just flag brand-new replies here, or also pull in related mentions of the `reason` enum from other threads (dashboards, Northwind launch, etc.)?",
      delay: 2800,
    },
    { from: 'me', text: 'Just this thread is fine — no need to go digging elsewhere.', delay: 1600 },
    {
      from: 'agent',
      text: 'Got it — starting now.',
      tag: (post) => buildThreadTag(post),
      chainOfThought: [
        'Reviewed the last 12 messages in this thread',
        'Indexed the `reason` enum values: explicit, timeout, fallback',
        'Cross-checked HandoffInitiated / HandoffCompleted event names against the telemetry schema',
        'Confirmed no existing watch is already covering this thread',
        'Set a watch for new replies mentioning reason, HandoffInitiated, or HandoffCompleted',
        'Scheduled a daily check-in at 5 PM to review anything the watch caught',
        'Will DM a summary if 3+ related replies land before end of day',
      ],
      delay: 3800,
    },
  ],
  // API review Thursday thread: a PR review-and-merge task. Cowork sets one
  // label — "PR #212 review & merge" — the moment it starts working, and
  // keeps it for the rest of the thread (through review, approval, and the
  // merge itself). One label per thread, not a phase-by-phase relabel: it
  // names the task, not the current step within it.
  'p25-2': [
    {
      from: 'me',
      text: `@${THREAD_AGENT?.name} can you review the manifest schema PR and merge it if everything checks out?`,
      delay: 1200,
    },
    {
      from: 'agent',
      text:
        'Sure — want me to merge automatically once CI is green and the review looks clean, or hold for your sign-off before merging?',
      delay: 2800,
    },
    { from: 'me', text: 'Hold for my sign-off — ping me before you merge anything.', delay: 1600 },
    {
      from: 'agent',
      text: 'Reviewed the manifest schema PR — looks clean. Want me to merge it?',
      tag: 'PR #212 review & merge',
      chainOfThought: [
        'Pulled agent-platform/api #212 (manifest schema v2)',
        "Checked required-vs-optional param validation against Thursday's pre-read",
        'Diffed the new schema against v1 to confirm no breaking changes for existing plugins',
        'Traced the nested-param edge case from the pre-read through the validation logic',
        'Confirmed CI is green — 42 checks passed, no merge conflicts',
        'Re-ran the plugin lifecycle hook tests locally against the branch',
        'Checked commit messages and PR description match the actual diff',
      ],
      link: {
        source: 'github',
        title: 'Manifest schema v2 — parameter validation',
        subtitle: 'agent-platform/api #212 · In review · CI passing',
        url: '#',
      },
      delay: 4600,
    },
    { from: 'me', text: 'Yes — go ahead and merge.', delay: 1800 },
    {
      from: 'agent',
      text: "Merged — here's the PR:",
      // No `tag` here — this reply inherits "PR #212 review & merge" from
      // above. The label describes the task the whole thread is about, so
      // it doesn't need to change just because the phase within that task
      // did.
      chainOfThought: [
        'Rebased agent-platform/api #212 onto latest main',
        'Re-ran CI on the rebased branch — all 42 checks still green',
        'Merged agent-platform/api #212 into main',
        'Squashed 6 commits into a single merge commit',
        'Deleted the source branch',
        'Notified #agent-platform on-call',
      ],
      link: {
        source: 'github',
        title: 'Manifest schema v2 — parameter validation',
        subtitle: 'agent-platform/api #212 · Merged',
        url: '#',
      },
      delay: 3800,
    },
    // Demonstrates the carry-forward: no `tag` declared here either, so this
    // message keeps inheriting "PR #212 review & merge" — the one label set
    // for this thread — rather than falling back to the plain "AI generated"
    // badge.
    {
      from: 'agent',
      text: "All set — #agent-platform on-call is looped in.",
      delay: 1800,
    },
  ],
}

// Right-pane thread view for a channel. Has two modes:
//   • Detail — root post + replies + compose. Header shows a back arrow and
//     the thread title.
//   • List — all threads in the current channel, click an item to open its
//     detail. Header reads "Threads".
// The back arrow on detail toggles to list; the X button closes the rail
// entirely. `initialPostId` opens the rail in detail mode for that post; if
// it changes from the outside (e.g. an Activity event re-targets the rail),
// the rail re-syncs to the new thread.
export default function ChannelThreadRail({ posts, initialPostId, activeContact, onClose }) {
  const [initialPostIdCursor, setInitialPostIdCursor] = useState(initialPostId)
  const [viewPostId, setViewPostId] = useState(initialPostId)
  if (initialPostIdCursor !== initialPostId) {
    setInitialPostIdCursor(initialPostId)
    setViewPostId(initialPostId)
  }

  const [extraRepliesByPost, setExtraRepliesByPost] = useState({})
  const [agentTypingPostId, setAgentTypingPostId] = useState(null)
  const autoRunPostIds = useRef(new Set())
  const [input, setInput] = useState('')
  const endRef = useRef(null)

  const post = viewPostId ? posts.find((p) => p.id === viewPostId) : null
  const extraReplies = post ? extraRepliesByPost[post.id] || [] : []
  const allReplies = post ? [...(post.replies || []), ...extraReplies] : []

  useEffect(() => {
    if (post) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [extraReplies, post?.id, agentTypingPostId])

  // Auto-play: opening a scripted thread (if Cowork hasn't joined yet) plays
  // out its THREAD_SCRIPTS entry on its own — nothing to type. `autoRunPostIds`
  // only marks a post as done once the sequence actually completes — NOT
  // eagerly at schedule time — so React 18 StrictMode's dev-only
  // double-invoke (mount → cleanup → mount) can't have its real run blocked
  // by a guard set during the throwaway first invocation. `cancelled`
  // (effect-local, not the ref) is what the cleanup uses to stop an
  // in-flight sequence.
  useEffect(() => {
    const script = post && THREAD_SCRIPTS[post.id]
    if (!post || !script || !THREAD_AGENT || autoRunPostIds.current.has(post.id)) return
    const alreadyEngaged = allReplies.some((r) => r.senderId === THREAD_AGENT_ID)
    if (alreadyEngaged) {
      autoRunPostIds.current.add(post.id)
      return
    }

    const postId = post.id
    let cancelled = false
    const timers = []
    // Cowork's current thread-scoped role label — starts unset, updated only
    // when a step explicitly declares `tag`, and carried onto every agent
    // message in between. Scoped to this effect run (one script per post),
    // so it never leaks across threads.
    let activeTag = null

    // Plays `script[index]`, then schedules `index + 1`. Agent steps show
    // the typing indicator first; a step's `tag` may be a plain string or a
    // `(post) => string` (used where the tag is derived from the post
    // itself, e.g. buildThreadTag) and *sets* the running label from that
    // point on. Agent steps with no `tag` of their own simply inherit
    // whatever label is currently active — this is what makes the pill
    // "stick" across a run of messages instead of needing to be repeated.
    const playStep = (index) => {
      if (cancelled) return
      if (index >= script.length) {
        autoRunPostIds.current.add(postId)
        return
      }
      const step = script[index]
      const isAgent = step.from === 'agent'
      const delay = step.delay ?? (isAgent ? 1400 : 900)
      const newTag = isAgent && step.tag != null ? (typeof step.tag === 'function' ? step.tag(post) : step.tag) : null
      const isSettingTag = newTag !== null

      if (isAgent) setAgentTypingPostId(postId)
      timers.push(setTimeout(() => {
        if (cancelled) return
        if (isAgent) setAgentTypingPostId((current) => (current === postId ? null : current))
        const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        const carriedTag = isAgent ? (newTag ?? activeTag) : null
        const msgId = `auto-${postId}-${index}`
        setExtraRepliesByPost((prev) => ({
          ...prev,
          [postId]: [
            ...(prev[postId] || []),
            {
              id: msgId,
              senderId: isAgent ? THREAD_AGENT_ID : 'me',
              text: isAgent ? step.text : withMentionHighlight(step.text),
              time,
              // A step that *sets* a new label starts in the "Setting tag…"
              // pending/pulse state (same pattern as the session-tag flow in
              // ChatView) and resolves to the real label a beat later — see
              // below — so it reads as the agent deciding on it in real
              // time. A step that merely inherits the already-active label
              // stamps it directly, no re-animation.
              ...(isSettingTag ? { tagPending: true } : carriedTag ? { tag: carriedTag } : {}),
              ...(step.chainOfThought ? { chainOfThought: step.chainOfThought } : {}),
              ...(step.link ? { link: step.link } : {}),
            },
          ],
        }))

        if (isSettingTag) {
          timers.push(setTimeout(() => {
            if (cancelled) return
            activeTag = newTag
            setExtraRepliesByPost((prev) => ({
              ...prev,
              [postId]: (prev[postId] || []).map((m) => (m.id === msgId ? { ...m, tagPending: false, tag: newTag } : m)),
            }))
            playStep(index + 1)
          }, 900))
        } else {
          playStep(index + 1)
        }
      }, delay))
    }

    playStep(0)

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [post?.id])

  const flattenSubject = (p) => {
    if (p.subject) return p.subject
    if (Array.isArray(p.text)) {
      return p.text.map((seg) => (typeof seg === 'string' ? seg : seg.name)).join('')
    }
    return p.text || ''
  }
  const titleText = post ? flattenSubject(post).replace(/\s+/g, ' ').trim() : 'Threads'

  const send = () => {
    const text = input.trim()
    if (!text || !post) return
    const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    setExtraRepliesByPost((prev) => ({
      ...prev,
      [post.id]: [
        ...(prev[post.id] || []),
        { id: `reply-${Date.now()}`, senderId: 'me', text: withMentionHighlight(text), time },
      ],
    }))
    setInput('')
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="channel-thread-rail">
      <div className="channel-thread-rail-header">
        <div className="channel-thread-rail-title-group">
          {post && (
            <IconButton
              label="Back to threads"
              className="channel-thread-rail-action channel-thread-rail-back"
              onClick={() => setViewPostId(null)}
            >
              <ChevronLeft size={18} />
            </IconButton>
          )}
          <div className="channel-thread-rail-title" title={titleText}>
            <span className="channel-thread-rail-title-subject">{titleText}</span>
          </div>
        </div>
        <div className="channel-thread-rail-actions">
          <IconButton label="More options" className="channel-thread-rail-action">
            <Dots size={16} />
          </IconButton>
          <IconButton label="Close" className="channel-thread-rail-action" onClick={onClose}>
            <Close />
          </IconButton>
        </div>
      </div>

      {post ? (
        <>
          <div className="channel-thread-rail-body">
            <div className="channel-thread-rail-messages">
              <MessageRow
                message={{ ...post, threadReply: undefined }}
                activeContact={activeContact}
              />
              {allReplies.map((reply) => (
                <MessageRow
                  key={reply.id}
                  message={reply}
                  activeContact={activeContact}
                />
              ))}
              {agentTypingPostId === post.id && (
                <TypingIndicator contact={THREAD_AGENT} className="channel-thread-rail-typing" />
              )}
              <div ref={endRef} />
            </div>
          </div>

          <div className="channel-thread-rail-compose">
            <div className="channel-thread-rail-compose-box">
              <input
                type="text"
                className="channel-thread-rail-input"
                placeholder="Reply"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
              />
              <IconButton label="Send" className="channel-thread-rail-send" onClick={send}>
                <Send />
              </IconButton>
            </div>
          </div>
        </>
      ) : posts.length === 0 ? (
        <div className="channel-thread-rail-body channel-thread-rail-body-empty">
          <div className="channel-thread-rail-empty">
            <div className="channel-thread-rail-empty-title">No threads yet</div>
            <div className="channel-thread-rail-empty-subtitle">
              Start a side conversation by selecting <em>Reply in thread</em> from any message
            </div>
          </div>
        </div>
      ) : (
        <div className="channel-thread-rail-body">
          <ul className="channel-thread-rail-list">
            {posts.map((p) => {
              const subject = flattenSubject(p).replace(/\s+/g, ' ').trim()
              const replyCount = (p.replies || []).length + (extraRepliesByPost[p.id]?.length || 0)
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    className="channel-thread-rail-list-item"
                    onClick={() => setViewPostId(p.id)}
                  >
                    <span className="channel-thread-rail-list-subject">{subject}</span>
                    <span className="channel-thread-rail-list-meta">
                      {p.time}
                      {replyCount > 0 && ` · ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
