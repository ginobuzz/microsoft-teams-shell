import {
  ChevronLeftRegular,
  ChevronRightRegular,
  DismissRegular,
  MoreHorizontalRegular,
  SearchRegular,
  SquareRegular,
  SubtractRegular,
} from '@fluentui/react-icons'
import { PresenceBadge } from '@fluentui/react-components'
import { currentUser } from '../data/contacts'
import { Avatar } from './common'
import TitleBarMoreMenu from './TitleBarMoreMenu'
import './TitleBar.css'

export default function TitleBar({ onShowFre }) {
  return (
    <header className="title-bar">
      <div className="title-bar-left">
        <img className="title-bar-logo" src="/teams-logo.png" alt="Microsoft Teams" />
      </div>

      <div className="title-bar-center">
        <button type="button" className="title-bar-nav-button" aria-label="Back">
          <ChevronLeftRegular />
        </button>
        <button type="button" className="title-bar-nav-button" aria-label="Forward">
          <ChevronRightRegular />
        </button>
        <div className="title-bar-search">
          <SearchRegular className="title-bar-search-icon" />
          <span className="title-bar-search-text">Search</span>
        </div>
      </div>

      <div className="title-bar-right">
        <TitleBarMoreMenu onShowFre={onShowFre}>
          <button type="button" className="title-bar-more-button" aria-label="More options">
            <MoreHorizontalRegular />
          </button>
        </TitleBarMoreMenu>

        <div className="title-bar-avatar" aria-label={currentUser.name}>
          <div className="title-bar-avatar-mask">
            <Avatar contact={currentUser} size={28} hideStatus />
          </div>
          <span className="title-bar-presence">
            <PresenceBadge status="available" size="extra-small" />
          </span>
        </div>

        <button type="button" className="title-bar-window-control" aria-label="Minimize">
          <SubtractRegular />
        </button>
        <button type="button" className="title-bar-window-control" aria-label="Maximize">
          <SquareRegular />
        </button>
        <button type="button" className="title-bar-window-control close" aria-label="Close">
          <DismissRegular />
        </button>
      </div>
    </header>
  )
}
