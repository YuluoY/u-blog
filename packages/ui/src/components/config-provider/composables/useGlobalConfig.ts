import { configProviderContextKey, type ConfigProviderContext } from '../consts'
import { getCurrentInstance, inject, computed, type Ref } from 'vue'
import { globalConfig } from './index'

export function useGlobalConfig<
  K extends keyof ConfigProviderContext,
  D extends ConfigProviderContext[K]
>(key: K, defaultValue: D): Ref<Exclude<ConfigProviderContext[K], void>>

export function useGlobalConfig(): Ref<ConfigProviderContext>;

export function useGlobalConfig(
  key?: keyof ConfigProviderContext,
  defaultValue = void 0
)
{
  const config = getCurrentInstance() ? inject(configProviderContextKey, globalConfig) : globalConfig

  return key ? computed(() => config.value?.[key] ?? defaultValue) : config
}