import { withInstallFunc } from '@/utils'
import NotificationFn from './methods'
import { CGlobal } from '../constants'

export const UNotificationFn = withInstallFunc(NotificationFn, CGlobal.NOTIFICATION)