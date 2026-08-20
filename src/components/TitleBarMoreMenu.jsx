import {
  Menu,
  MenuDivider,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
} from '@fluentui/react-components'
import {
  CastRegular,
  PersonFeedbackRegular,
  QuestionCircleRegular,
  SettingsRegular,
} from '@fluentui/react-icons'
import './TitleBarMoreMenu.css'

export default function TitleBarMoreMenu({ children, onShowFre }) {
  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>{children}</MenuTrigger>
      <MenuPopover className="title-bar-menu-popover">
        <MenuList>
          <MenuItem icon={<SettingsRegular />}>Settings</MenuItem>
          <MenuItem icon={<CastRegular />}>Cast</MenuItem>
          <MenuItem icon={<QuestionCircleRegular />}>Help</MenuItem>
          <MenuItem icon={<PersonFeedbackRegular />}>Feedback</MenuItem>
          <MenuDivider />
          <MenuItem onClick={onShowFre}>About this prototype</MenuItem>
          <MenuItem>Keyboard shortcuts</MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  )
}
