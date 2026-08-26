import { useState, useCallback } from 'react'
import { agentSessions as initialSessions, activityEvents as seedActivityEvents } from './data'
import NavRail from './components/NavRail'
import ChatList from './components/ChatList'
import ChatView from './components/ChatView'
import ActivityList from './components/ActivityList'
import TitleBar from './components/TitleBar'
import { FreModal } from './components/common'
import './App.css'

// Contact id for Project Northwind's "General" channel and the post ids for
// its "API review Thursday" and "Handoff analytics" threads — targets for
// the post-FRE demo arrows. The arrow visits API review first (full
// review-and-merge flow), then Handoff analytics, so the user sees Cowork
// carrying a different, concurrent label in each thread.
const NORTHWIND_GENERAL_ID = 25
const API_REVIEW_POST_ID = 'p25-2'
const HANDOFF_ANALYTICS_POST_ID = 'p25-3'

export default function App() {
  const [activeView, setActiveView] = useState('chat') // 'chat' | 'activity'
  const [activeChatId, setActiveChatId] = useState(1)
  const [readChatIds, setReadChatIds] = useState(() => new Set([1]))
  const [sessions, setSessions] = useState(initialSessions)
  const [dynamicSessionMessages, setDynamicSessionMessages] = useState({})
  // Activity feed: persist which events the user has opened so unread decorations clear.
  const [activityEvents, setActivityEvents] = useState(seedActivityEvents)
  const [activeActivityId, setActiveActivityId] = useState(null)
  // When navigating to a chat, optionally tell ChatView to open a specific
  // session (sessions rail), open a specific channel thread, or flash a
  // specific message so the user can see where a notification landed.
  const [navIntent, setNavIntent] = useState(null)
  // FRE shows on every load while iterating on the prototype — dismiss only
  // hides it for the current session. Swap to localStorage gating later if a
  // real first-run-only behavior is needed.
  const [showFre, setShowFre] = useState(true)
  // Post-FRE walkthrough: 'none' → 'general' (arrow at Project Northwind's
  // General channel) → 'apiReview' (arrow at the API review Thursday post's
  // reply badge — Cowork runs the full review-and-merge flow there, setting
  // its "PR #212 review & merge" label) → 'handoff' (once that thread's
  // done, the arrow moves to the Handoff analytics post, guiding the user to
  // a second thread where Cowork sets a different, concurrent label —
  // "watching this thread") → 'none' (done). Starts once the FRE is
  // dismissed.
  const [demoStep, setDemoStep] = useState('none')

  const dismissFre = useCallback(() => {
    setShowFre(false)
    setDemoStep('general')
  }, [])

  const selectChat = useCallback((chatId) => {
    setActiveChatId(chatId)
    setReadChatIds(prev => (prev.has(chatId) ? prev : new Set(prev).add(chatId)))
    setDemoStep(prev => (prev === 'general' && chatId === NORTHWIND_GENERAL_ID ? 'apiReview' : prev))
  }, [])

  const navigateToChat = useCallback((chatId, { showSessions, sessionId } = {}) => {
    selectChat(chatId)
    if (showSessions) setNavIntent({ chatId, sessionId: sessionId || null })
  }, [selectChat])

  const clearNavIntent = useCallback(() => setNavIntent(null), [])

  const addSession = useCallback((agentId, session, messages) => {
    setSessions(prev => ({
      ...prev,
      [agentId]: [session, ...(prev[agentId] || [])],
    }))
    if (messages) {
      setDynamicSessionMessages(prev => ({ ...prev, [session.id]: messages }))
    }
  }, [])

  const updateSession = useCallback((agentId, sessionId, updates) => {
    setSessions(prev => ({
      ...prev,
      [agentId]: (prev[agentId] || []).map(s =>
        s.id === sessionId ? { ...s, ...updates } : s
      ),
    }))
  }, [])

  const updateSessionMessages = useCallback((sessionId, messages) => {
    setDynamicSessionMessages(prev => ({ ...prev, [sessionId]: messages }))
  }, [])

  const selectActivity = useCallback((event) => {
    setActiveActivityId(event.id)
    setActivityEvents(prev =>
      prev.map(e => (e.id === event.id && e.unread ? { ...e, unread: false } : e))
    )
    setActiveChatId(event.chatId)
    setReadChatIds(prev => (prev.has(event.chatId) ? prev : new Set(prev).add(event.chatId)))
    setNavIntent({
      chatId: event.chatId,
      channelThreadPostId: event.postId || null,
      highlightMessageId: event.messageId || null,
    })
  }, [])

  const activityUnreadCount = activityEvents.reduce((n, e) => n + (e.unread ? 1 : 0), 0)

  return (
    <div className="app">
      <TitleBar onShowFre={() => setShowFre(true)} />
      <div className="app-body">
        <NavRail
          activeView={activeView}
          onSelectView={setActiveView}
          activityUnreadCount={activityUnreadCount}
        />
        {activeView === 'activity' ? (
          <ActivityList
            events={activityEvents}
            activeEventId={activeActivityId}
            onSelectEvent={selectActivity}
          />
        ) : (
          <ChatList
            activeChatId={activeChatId}
            onSelectChat={selectChat}
            readChatIds={readChatIds}
            demoArrowContactId={demoStep === 'general' ? NORTHWIND_GENERAL_ID : null}
          />
        )}
        <ChatView
          activeChatId={activeChatId}
          onSelectChat={navigateToChat}
          sessions={sessions}
          addSession={addSession}
          updateSession={updateSession}
          updateSessionMessages={updateSessionMessages}
          dynamicSessionMessages={dynamicSessionMessages}
          navIntent={navIntent}
          clearNavIntent={clearNavIntent}
          demoArrowPostId={
            demoStep === 'apiReview'
              ? API_REVIEW_POST_ID
              : demoStep === 'handoff'
                ? HANDOFF_ANALYTICS_POST_ID
                : null
          }
          onDemoArrowPostOpened={() =>
            setDemoStep(prev => (prev === 'apiReview' ? 'handoff' : 'none'))
          }
        />
      </div>
      {showFre && (
        <FreModal
          title="Dynamic Agent Name/Label Customization"
          subtitle="An ask from Anthropic and GitHub Copilot: give agents a way to say what role they're playing in a specific thread, right next to their name — not just that they're AI."
          onDismiss={dismissFre}
        >
          <h3 className="fre-section-title">Today</h3>
          <p>
            A message from an agent can already be annotated with an
            "AI Generated" tag, so people can tell a bot posted it. That
            works fine for a single reply, but agents increasingly run
            long, multi-message tasks inside a thread — reviewing a PR,
            triaging a bug, drafting a doc — and every message just says
            "AI Generated" regardless of what the agent is actually doing.
          </p>

          <h3 className="fre-section-title">Problem</h3>
          <p>
            For long-running tasks in a thread, there's no way to annotate
            or distinguish the role an agent is operating in. A teammate
            skimming the thread can't tell "reviewing PR #123" from
            "summarizing the incident" from "drafting release notes" — the
            agent's name and the generic AI tag look identical every time.
          </p>

          <h3 className="fre-section-title">Solution</h3>
          <p>
            Allow custom tags / name aliases: a bot can set a short
            (under 50 characters) plain-text label scoped to a single
            thread or conversation. Every message the bot posts in that
            thread renders with the label appended to its author name —
            e.g. <strong>Claude [reviewing PR #123]</strong>.
          </p>
          <p>
            The label is applied at send time, per outgoing message — not
            a global account rename. That means different threads can show
            different labels for the same agent concurrently, and existing
            messages already posted don't retroactively change when the
            label updates.
          </p>

          <h3 className="fre-section-title">Requirements</h3>
          <ul className="fre-feature-list">
            <li className="fre-feature">
              <span className="fre-feature-check">✓</span>
              <span className="fre-feature-text">
                <span className="fre-feature-title">Length limit</span>
                <span className="fre-feature-desc"> Labels must be under 50 characters, plain text.</span>
              </span>
            </li>
            <li className="fre-feature">
              <span className="fre-feature-check">✓</span>
              <span className="fre-feature-text">
                <span className="fre-feature-title">Mutually exclusive with AI Generated tag</span>
                <span className="fre-feature-desc"> Once a custom label is applied, the generic "AI Generated" tag is suppressed for that message.</span>
              </span>
            </li>
            <li className="fre-feature">
              <span className="fre-feature-check">✓</span>
              <span className="fre-feature-text">
                <span className="fre-feature-title">Per-thread scoping</span>
                <span className="fre-feature-desc"> Labels can differ across threads — the same agent can show a different label in each conversation.</span>
              </span>
            </li>
            <li className="fre-feature">
              <span className="fre-feature-check">✓</span>
              <span className="fre-feature-text">
                <span className="fre-feature-title">Applied at send time, not retroactive</span>
                <span className="fre-feature-desc"> The label is attached per outgoing message, not a global rename. Updating it doesn't change the label on messages already posted.</span>
              </span>
            </li>
            <li className="fre-feature">
              <span className="fre-feature-check">✓</span>
              <span className="fre-feature-text">
                <span className="fre-feature-title">Resets for new threads</span>
                <span className="fre-feature-desc"> A new thread starts back at the plain "AI Generated" tag until the agent sets a label for that thread.</span>
              </span>
            </li>
          </ul>

          <h3 className="fre-section-title">What this Unlocks</h3>
          <p>
            Anyone scanning a thread can immediately see what role an agent
            is playing there, without opening a session or asking. Agents
            working several jobs at once across different threads stay
            clearly distinguished, and the label trail itself becomes a
            lightweight, at-a-glance history of what the agent was doing
            and when.
          </p>

          <h3 className="fre-section-title">Open Questions</h3>
          <p>
            <strong>How does this evolve with the AI agent badge?</strong>{' '}
            Does the custom label replace "AI Generated" outright, or sit
            alongside a smaller, always-present compliance badge?
          </p>
        </FreModal>
      )}
    </div>
  )
}
