import i18n from "i18n"
import appCfg from "@/app"

i18n.configure(appCfg.plugins.i18n)

export const I18n = i18n.init
