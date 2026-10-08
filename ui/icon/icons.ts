// Icon data for app-ui-icon: one file per icon in ./set.
// The toaster imports this file, so every icon re-exported here that the app uses is in the initial bundle. Import
// the icons below from here (they stay in one file with the icon component), and any other icon from its own file,
// `ui/icon/set/<name>`: re-exporting it here would put it in the initial bundle.

// An app shell and the toaster draw these on the first screen: in the initial bundle anyway, with the icon component.
export { ICON_ALERT_CIRCLE } from './set/alert-circle';
export { ICON_ARROW_LEFT } from './set/arrow-left';
export { ICON_BUILDING_COMMUNITY } from './set/building-community';
export { ICON_CALENDAR } from './set/calendar';
export { ICON_CHECK_CIRCLE } from './set/check-circle';
export { ICON_DOTS } from './set/dots';
export { ICON_HOME } from './set/home';
export { ICON_INFO_CIRCLE } from './set/info-circle';
export { ICON_LIST_CHECK } from './set/list-check';
export { ICON_WARNING } from './set/warning';
export { ICON_X } from './set/x';

// Imported from here by the menu (DOTS_VERTICAL) and the icon-button spec (EDIT).
export { ICON_DOTS_VERTICAL } from './set/dots-vertical';
export { ICON_EDIT } from './set/edit';
