import { Sparkle } from './Icon'
import './AgentTag.css'

// Small pill that surfaces an agent's self-reported current task, scoped to
// one session. The agent (not the user) generates this text — see
// DESIGN_GUIDE.md "Agent Session Tags" for the pattern and length rule
// (< 50 chars). Render next to the agent's name wherever a session is in
// scope (chat header, sessions rail row).
export default function AgentTag({ text, pending = false, className = '' }) {
  if (!pending && !text) return null
  return (
    <span
      className={`agent-tag${pending ? ' agent-tag-pending' : ''}${className ? ` ${className}` : ''}`}
      title={pending ? undefined : text}
    >
      <Sparkle size={9} />
      <span className="agent-tag-text">{pending ? 'Setting tag…' : text}</span>
    </span>
  )
}
