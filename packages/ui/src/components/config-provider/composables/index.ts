import { ref } from "vue";
import { ConfigProviderContext } from "../consts";

export const globalConfig = ref<ConfigProviderContext>()

export * from './useGlobalConfig'
export * from './useProvideGlobalConfig'
export * from './useLocale'



