import components from './components'
import { makeInstaller } from '@/utils'
import '@/theme/index.scss'

import { library } from '@fortawesome/fontawesome-svg-core'

// 按需导入 solid 图标，避免全量导入 (~1.6MB)
import {
  faMinus, faPlus, faTimes, faCircleXmark, faChevronDown, faChevronUp,
  faChevronLeft, faChevronRight, faCheck, faSpinner, faCircleInfo,
  faCircleCheck, faTriangleExclamation, faCircleExclamation, faCircleQuestion,
  faBold, faAnglesLeft, faAnglesRight, faPen, faTrashCan, faCloudArrowUp,
  faShare, faLocationDot, faLink, faItalic, faStrikethrough, faCode,
  faHeading, faQuoteLeft, faListUl, faListOl, faFileCode, faPenToSquare,
  faEye, faArrowLeft, faBlog, faPenNib, faComments, faBookmark, faUser,
  faLock, faEnvelope, faShieldHalved, faCircleUser, faHouseUser, faUserPen,
  faShareNodes, faGear, faRightFromBracket, faRotate, faXmark, faStop,
  faArrowUp, faHistory, faFolderPlus, faFolderOpen, faFolder, faTrash,
  faArrowRightFromBracket, faTrashAlt, faFaceSmile, faDownload,
  faLightbulb, faGlobe, faWandMagicSparkles, faExpand, faCompress,
  faLanguage, faForward, faMagnifyingGlass, faTags, faChartSimple,
  faSun, faMoon, faCalendarDays, faClock, faHeart, faComment, faFileLines,
  faThumbtack, faHouse, faPaperPlane, faBookOpen, faFeather, faCalendar,
  faImage, faAlignLeft, faPalette, faMicrochip, faSquare, faGlassWater, faWater,
  faRobot, faSave, faUpload, faSliders, faBrain, faLayerGroup, faCube,
  faPuzzlePiece, faSitemap, faRocket, faCalendarCheck, faUndo,
  faEllipsis, faFileArrowDown, faCamera, faFire, faZ, faCodeBranch, faRss,
  faBell, faEnvelopeCircleCheck, faList, faTableCellsLarge, faArrowUpRightFromSquare
} from '@fortawesome/free-solid-svg-icons'

// 按需导入 regular 图标
import {
  faCommentDots as farCommentDots,
  faComment as farComment,
  faFaceSmile as farFaceSmile,
  faEye as farEye,
  faHeart as farHeart,
  faUser as farUser
} from '@fortawesome/free-regular-svg-icons'

// 按需导入 brands 图标
import {
  faGithub, faXTwitter, faWeibo, faZhihu, faLinkedin,
  faBilibili, faYoutube, faTelegram, faDiscord,
  faFacebook, faInstagram, faTiktok, faReddit, faStackOverflow,
  faMedium, faDev, faCodepen, faDribbble, faBehance,
  faFigma, faSpotify, faTwitch, faPinterest, faMastodon, faThreads, faNpm
} from '@fortawesome/free-brands-svg-icons'

library.add(
  // solid
  faMinus, faPlus, faTimes, faCircleXmark, faChevronDown, faChevronUp,
  faChevronLeft, faChevronRight, faCheck, faSpinner, faCircleInfo,
  faCircleCheck, faTriangleExclamation, faCircleExclamation, faCircleQuestion,
  faBold, faAnglesLeft, faAnglesRight, faPen, faTrashCan, faCloudArrowUp,
  faShare, faLocationDot, faLink, faItalic, faStrikethrough, faCode,
  faHeading, faQuoteLeft, faListUl, faListOl, faFileCode, faPenToSquare,
  faEye, faArrowLeft, faBlog, faPenNib, faComments, faBookmark, faUser,
  faLock, faEnvelope, faShieldHalved, faCircleUser, faHouseUser, faUserPen,
  faShareNodes, faGear, faRightFromBracket, faRotate, faXmark, faStop,
  faArrowUp, faHistory, faFolderPlus, faFolderOpen, faFolder, faTrash,
  faArrowRightFromBracket, faTrashAlt, faFaceSmile, faDownload,
  faLightbulb, faGlobe, faWandMagicSparkles, faExpand, faCompress,
  faLanguage, faForward, faMagnifyingGlass, faTags, faChartSimple,
  faSun, faMoon, faCalendarDays, faClock, faHeart, faComment, faFileLines,
  faThumbtack, faHouse, faPaperPlane, faBookOpen, faFeather, faCalendar,
  faImage, faAlignLeft, faPalette, faMicrochip, faSquare, faGlassWater, faWater,
  faRobot, faSave, faUpload, faSliders, faBrain, faLayerGroup, faCube,
  faPuzzlePiece, faSitemap, faRocket, faCalendarCheck, faUndo,
  faEllipsis, faFileArrowDown, faCamera, faFire, faZ, faCodeBranch, faRss,
  faBell, faEnvelopeCircleCheck, faList, faTableCellsLarge, faArrowUpRightFromSquare,
  // regular
  farCommentDots, farComment, farFaceSmile, farEye, farHeart, farUser,
  // brands
  faGithub, faXTwitter, faWeibo, faZhihu, faLinkedin,
  faBilibili, faYoutube, faTelegram, faDiscord,
  faFacebook, faInstagram, faTiktok, faReddit, faStackOverflow,
  faMedium, faDev, faCodepen, faDribbble, faBehance,
  faFigma, faSpotify, faTwitch, faPinterest, faMastodon, faThreads, faNpm
)

const install = makeInstaller(components.map((v: any) => ({ ...v, name: v.name?.startsWith('U') ? v.name : `U${v.name}` })) as any)

export * from '@/components'
/** 显式从子包再导出，避免 barrel 被 tree-shake 后打包缺失 */
export { USelect } from '@/components/select'
export { UCascader } from '@/components/cascader'
export { UMonthPicker } from '@/components/month-picker'
export { UCalendarGrid } from '@/components/calendar-grid'
export { UText } from '@/components/text'
export * from '@/locale'
export default install
