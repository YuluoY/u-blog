/**
 * UI 组件库按需注册插件
 * 集中管理：组件注册、按需 CSS、FontAwesome 图标
 */
import type { App, Plugin } from 'vue'

// ─── 1. 基础样式（主题变量 + reset + 工具类） ───
import '@u-blog/ui/dist/es/base.css'

// ─── 2. 按需组件样式 ───
import '@u-blog/ui/dist/es/components/back-top/style.css'
import '@u-blog/ui/dist/es/components/badge/style.css'
import '@u-blog/ui/dist/es/components/button/style.css'
import '@u-blog/ui/dist/es/components/calendar-grid/style.css'
import '@u-blog/ui/dist/es/components/card/style.css'
import '@u-blog/ui/dist/es/components/cascader/style.css'
import '@u-blog/ui/dist/es/components/checkbox/style.css'
import '@u-blog/ui/dist/es/components/comment/style.css'
import '@u-blog/ui/dist/es/components/date-time-picker/style.css'
import '@u-blog/ui/dist/es/components/dialog/style.css'
import '@u-blog/ui/dist/es/components/drawer/style.css'
import '@u-blog/ui/dist/es/components/dropdown/style.css'
import '@u-blog/ui/dist/es/components/expandable-row/style.css'
import '@u-blog/ui/dist/es/components/filter-chips/style.css'
import '@u-blog/ui/dist/es/components/floating-toolbar/style.css'
import '@u-blog/ui/dist/es/components/form/style.css'
import '@u-blog/ui/dist/es/components/icon/style.css'
import '@u-blog/ui/dist/es/components/image/style.css'
import '@u-blog/ui/dist/es/components/input/style.css'
import '@u-blog/ui/dist/es/components/layout/style.css'
import '@u-blog/ui/dist/es/components/message/style.css'
import '@u-blog/ui/dist/es/components/month-picker/style.css'
import '@u-blog/ui/dist/es/components/notification/style.css'
import '@u-blog/ui/dist/es/components/progress-bar/style.css'
import '@u-blog/ui/dist/es/components/select/style.css'
import '@u-blog/ui/dist/es/components/slider/style.css'
import '@u-blog/ui/dist/es/components/stats-bar/style.css'
import '@u-blog/ui/dist/es/components/tag/style.css'
import '@u-blog/ui/dist/es/components/text/style.css'
import '@u-blog/ui/dist/es/components/tooltip/style.css'
import '@u-blog/ui/dist/es/components/upload/style.css'

// ─── 3. 按需组件导入 ───
import {
  UBackTop,
  UButton,
  UCalendarGrid,
  UCard,
  UCascader,
  UCheckbox,
  UComment,
  UCommentInput,
  UCommentList,
  UDateTimePicker,
  UDialog,
  UDrawer,
  UExpandableRow,
  UFilterChips,
  UFloatingToolbar,
  UForm,
  UFormItem,
  UIcon,
  UImage,
  UInput,
  ULayout,
  UMonthPicker,
  UProgressBar,
  URegion,
  USelect,
  USlider,
  UStatsBar,
  UTabs,
  UTag,
  UText,
  UTooltip,
  UUpload
} from '@u-blog/ui'

// ─── 4. FontAwesome 按需注册 ───
import { library } from '@fortawesome/fontawesome-svg-core'

import {
  faAlignLeft, faAnglesLeft, faAnglesRight, faArrowLeft, faArrowRightFromBracket,
  faArrowUp, faArrowUpRightFromSquare, faBell, faBlog, faBold, faBookOpen,
  faBookmark, faBrain, faCalendar, faCalendarCheck, faCalendarDays, faCamera,
  faChartSimple, faCheck, faChevronDown, faChevronLeft, faChevronRight,
  faChevronUp, faCircleCheck, faCircleExclamation, faCircleInfo, faCircleQuestion,
  faCircleUser, faCircleXmark, faClock, faCloudArrowUp, faCode, faCodeBranch,
  faComment, faComments, faCompress, faCube, faDownload, faEllipsis, faEnvelope,
  faEnvelopeCircleCheck, faExpand, faEye, faFeather, faFileArrowDown, faFileCode,
  faFileLines, faFire, faFolder, faFolderOpen, faFolderPlus, faForward, faGear,
  faGlassWater, faGlobe, faHeading, faHeart, faHistory, faHouse, faHouseUser,
  faImage, faItalic, faLanguage, faLayerGroup, faLightbulb, faLink, faList,
  faListOl, faListUl, faLocationDot, faLock, faMagnifyingGlass, faMicrochip,
  faMinus, faMoon, faPalette, faPaperPlane, faPen, faPenNib, faPenToSquare,
  faPlus, faPuzzlePiece, faQuoteLeft, faRightFromBracket, faRobot, faRocket,
  faRotate, faRss, faSave, faShare, faShareNodes, faShieldHalved, faSitemap,
  faSliders, faSpinner, faSquare, faStop, faStrikethrough, faSun,
  faTableCellsLarge, faTags, faThumbtack, faTimes, faTrash, faTrashAlt,
  faTrashCan, faTriangleExclamation, faUndo, faUpload, faUser, faUserPen,
  faUsers, faWandMagicSparkles, faWater, faXmark, faZ
} from '@fortawesome/free-solid-svg-icons'

import {
  faComment as farComment,
  faCommentDots as farCommentDots,
  faEye as farEye,
  faFaceSmile as farFaceSmile,
  faHeart as farHeart,
  faUser as farUser
} from '@fortawesome/free-regular-svg-icons'

import {
  faBehance, faBilibili, faCodepen, faDev, faDiscord, faDribbble, faFacebook,
  faFigma, faGithub, faInstagram, faLinkedin, faMastodon, faMedium, faNpm,
  faPinterest, faReddit, faSpotify, faStackOverflow, faTelegram, faThreads,
  faTiktok, faTwitch, faWeibo, faXTwitter, faYoutube
} from '@fortawesome/free-brands-svg-icons'

library.add(
  // solid
  faAlignLeft, faAnglesLeft, faAnglesRight, faArrowLeft, faArrowRightFromBracket,
  faArrowUp, faArrowUpRightFromSquare, faBell, faBlog, faBold, faBookOpen,
  faBookmark, faBrain, faCalendar, faCalendarCheck, faCalendarDays, faCamera,
  faChartSimple, faCheck, faChevronDown, faChevronLeft, faChevronRight,
  faChevronUp, faCircleCheck, faCircleExclamation, faCircleInfo, faCircleQuestion,
  faCircleUser, faCircleXmark, faClock, faCloudArrowUp, faCode, faCodeBranch,
  faComment, faComments, faCompress, faCube, faDownload, faEllipsis, faEnvelope,
  faEnvelopeCircleCheck, faExpand, faEye, faFeather, faFileArrowDown, faFileCode,
  faFileLines, faFire, faFolder, faFolderOpen, faFolderPlus, faForward, faGear,
  faGlassWater, faGlobe, faHeading, faHeart, faHistory, faHouse, faHouseUser,
  faImage, faItalic, faLanguage, faLayerGroup, faLightbulb, faLink, faList,
  faListOl, faListUl, faLocationDot, faLock, faMagnifyingGlass, faMicrochip,
  faMinus, faMoon, faPalette, faPaperPlane, faPen, faPenNib, faPenToSquare,
  faPlus, faPuzzlePiece, faQuoteLeft, faRightFromBracket, faRobot, faRocket,
  faRotate, faRss, faSave, faShare, faShareNodes, faShieldHalved, faSitemap,
  faSliders, faSpinner, faSquare, faStop, faStrikethrough, faSun,
  faTableCellsLarge, faTags, faThumbtack, faTimes, faTrash, faTrashAlt,
  faTrashCan, faTriangleExclamation, faUndo, faUpload, faUser, faUserPen,
  faUsers, faWandMagicSparkles, faWater, faXmark, faZ,
  // regular
  farComment, farCommentDots, farEye, farFaceSmile, farHeart, farUser,
  // brands
  faBehance, faBilibili, faCodepen, faDev, faDiscord, faDribbble, faFacebook,
  faFigma, faGithub, faInstagram, faLinkedin, faMastodon, faMedium, faNpm,
  faPinterest, faReddit, faSpotify, faStackOverflow, faTelegram, faThreads,
  faTiktok, faTwitch, faWeibo, faXTwitter, faYoutube
)

// ─── 5. 组件注册列表 ───
const components: Record<string, any> = {
  UBackTop,
  UButton,
  UCalendarGrid,
  UCard,
  UCascader,
  UCheckbox,
  UComment,
  UCommentInput,
  UCommentList,
  UDateTimePicker,
  UDialog,
  UDrawer,
  UExpandableRow,
  UFilterChips,
  UFloatingToolbar,
  UForm,
  UFormItem,
  UIcon,
  UImage,
  UInput,
  ULayout,
  UMonthPicker,
  UProgressBar,
  URegion,
  USelect,
  USlider,
  UStatsBar,
  UTabs,
  UTag,
  UText,
  UTooltip,
  UUpload
}

const UccUI: Plugin = {
  install(app: App)
  {
    // 使用 app.use() 触发各组件的 install 方法（如 UTooltip 需要创建 #u-popper-container）
    for (const component of Object.values(components))
    {
      if (typeof component?.install === 'function')
        app.use(component)
      else
        app.component(component.name, component)
    }
  }
}

export default UccUI
