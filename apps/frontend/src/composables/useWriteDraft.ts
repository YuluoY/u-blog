import { ref, watch, onMounted } from 'vue'
import { STORAGE_KEYS } from '@/constants/storage'
import { getDraft, putDraft, migrateDraftFromLocalStorage } from '@/utils/writeDraftDb'

const DEFAULT_DRAFT = ''

/**
 * 撰写页草稿：从 IndexedDB 恢复，变更时防抖写入，支持快捷键立即写入与迁移 localStorage 旧数据
 */
export function useWriteDraft(debounceMs = 250) {
  const draft = ref<string>(DEFAULT_DRAFT)
  let timer: ReturnType<typeof setTimeout> | null = null
  let initDone = false

  /** 立即写入 IndexedDB（供快捷键保存调用） */
  async function flushDraft(): Promise<void> {
    await putDraft(draft.value)
  }

  onMounted(async () => {
    if (initDone) return
    try {
      const record = await getDraft()
      if (record?.content != null) {
        if (draft.value === DEFAULT_DRAFT) draft.value = record.content
      } else {
        const migrated = await migrateDraftFromLocalStorage(() => {
          try {
            return localStorage.getItem(STORAGE_KEYS.WRITE_DRAFT) ?? ''
          } catch {
            return ''
          }
        })
        if (migrated) {
          try {
            localStorage.removeItem(STORAGE_KEYS.WRITE_DRAFT)
          } catch {
            /* ignore */
          }
          const after = await getDraft()
          if (after?.content != null && draft.value === DEFAULT_DRAFT) draft.value = after.content
        }
      }
    } catch {
      /* fallback 留空 */
    } finally {
      initDone = true
    }
  })

  watch(
    draft,
    (value) => {
      if (!initDone) return
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        putDraft(value).catch(() => {})
        timer = null
      }, debounceMs)
    },
    { deep: false }
  )

  return { draft, flushDraft }
}
