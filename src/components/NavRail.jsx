import {
  AddSquareRegular,
  AlertFilled,
  AlertRegular,
  CalendarLtrRegular,
  CallRegular,
  ChatFilled,
  ChatRegular,
  CloudRegular,
  MoreHorizontalRegular,
} from '@fluentui/react-icons'
import './NavRail.css'

const navItems = [
  { id: 'activity', label: 'Activity', icon: AlertRegular, activeIcon: AlertFilled },
  { id: 'chat', label: 'Chat', icon: ChatRegular, activeIcon: ChatFilled },
  { id: 'calendar', label: 'Calendar', icon: CalendarLtrRegular },
  { id: 'calls', label: 'Calls', icon: CallRegular },
  { id: 'onedrive', label: 'OneDrive', icon: CloudRegular, iconClassName: 'app-rail-onedrive-icon' },
  { id: 'copilot', label: 'Copilot', image: '/Copilot.svg' },
  { id: 'more', label: 'More', icon: MoreHorizontalRegular },
  { id: 'apps', label: 'Apps', icon: AddSquareRegular },
]

export default function NavRail({ activeView = 'chat', onSelectView, activityUnreadCount = 0 }) {
  return (
    <nav className="app-rail" aria-label="Apps">
      {navItems.map((item) => {
        const selectable = item.id === 'chat' || item.id === 'activity'
        const active = selectable && item.id === activeView
        const Icon = active && item.activeIcon ? item.activeIcon : item.icon
        const badge = item.id === 'activity' ? activityUnreadCount : item.id === 'chat' ? 5 : 0

        return (
          <button
            key={item.id}
            type="button"
            className={`app-rail-tab${active ? ' active' : ''}`}
            onClick={selectable ? () => onSelectView?.(item.id) : undefined}
            aria-label={item.label}
            aria-pressed={selectable ? active : undefined}
          >
            {active && <span className="app-rail-active-bar" />}
            {badge > 0 && <span className="app-rail-badge">{badge > 99 ? '99+' : badge}</span>}
            <span className={`app-rail-icon${badge ? ' has-badge' : ''}${item.iconClassName ? ` ${item.iconClassName}` : ''}`}>
              {item.image ? (
                <img src={item.image} alt="" className="app-rail-copilot-icon" />
              ) : (
                <Icon />
              )}
            </span>
            <span className="app-rail-label">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
