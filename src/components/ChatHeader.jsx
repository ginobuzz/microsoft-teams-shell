import {
  AddSquareRegular,
  ChannelShareRegular,
  ChatMultipleFilled,
  ChatMultipleRegular,
  ChevronDownRegular,
  GuestRegular,
  MoreHorizontalRegular,
  PanelRightExpandRegular,
  VideoRegular,
} from '@fluentui/react-icons'
import { Avatar } from './common'
import './ChatHeader.css'

export default function ChatHeader({
  activeContact,
  isChannel,
  isGroup,
  hasSessions,
  showSessions,
  onToggleSessions,
  showThreads,
  onToggleThreads,
}) {
  return (
    <header className="chat-view-header">
      <div className="chat-header-top-row">
        <div className="chat-header-identity">
          <Avatar contact={activeContact} size={32} />
          <span className="chat-header-name">{activeContact.name}</span>
        </div>

        <div className="chat-header-actions">
          {isChannel && (
            <div className="chat-header-badge-cluster" aria-label="Channel sensitivity">
              <span className="chat-header-cluster-icon"><ChannelShareRegular /></span>
              <span className="chat-header-cluster-divider" />
              <span className="chat-header-cluster-icon"><GuestRegular /></span>
              <span className="chat-header-cluster-divider" />
              <span className="chat-header-cluster-text">Confidential</span>
            </div>
          )}

          <button type="button" className="chat-header-video-split" aria-label="Meet now">
            <span className="chat-header-video-icon"><VideoRegular /></span>
            <span className="chat-header-video-chevron"><ChevronDownRegular /></span>
          </button>

          <span className="chat-header-action-divider" />

          {(isGroup || isChannel) && (
            <button
              type="button"
              className={`chat-header-icon-button${showThreads ? ' active' : ''}`}
              aria-label="Threads"
              aria-pressed={showThreads}
              onClick={onToggleThreads}
            >
              {showThreads ? <ChatMultipleFilled /> : <ChatMultipleRegular />}
            </button>
          )}

          <button
            type="button"
            className={`chat-header-icon-button${showSessions ? ' active' : ''}`}
            aria-label={hasSessions ? 'Sessions' : 'Open side panel'}
            aria-pressed={hasSessions ? showSessions : undefined}
            onClick={hasSessions ? onToggleSessions : undefined}
          >
            <PanelRightExpandRegular />
          </button>

          <button type="button" className="chat-header-icon-button" aria-label="More options">
            <MoreHorizontalRegular />
          </button>
        </div>
      </div>

      <nav className="chat-header-tabs" aria-label="Conversation tabs">
        <button type="button" className="chat-view-tab active">
          {isChannel ? 'Conversation' : 'Chat'}
          <span className="chat-view-tab-indicator" />
        </button>
        <button type="button" className="chat-view-tab">Shared</button>
        <button type="button" className="chat-view-tab">Notes</button>
        <button type="button" className="chat-header-add-tab" aria-label="Add tab">
          <AddSquareRegular />
        </button>
      </nav>
    </header>
  )
}
