import { useHeaderStore, TOP_NAV_HEIGHT_PX } from '@/stores/header'
import { useArticleStore } from '@/stores/model/article'
import { watchFn } from '@u-blog/utils'
import { MdCatalog, MdPreview } from 'md-editor-v3'
import { Teleport, type Component, type CSSProperties, ref, watch, computed } from 'vue'
import { storeToRefs } from 'pinia'
import 'md-editor-v3/lib/preview.css'

export const usePreviewMd = ({
  articleId
}: {
  articleId: string
}): {
  Preview: Component | null
  Catalog: Component | null
  articleContent: ReturnType<typeof computed<string>>
} =>
{
  const id = 'preview-only'
  const rightSideId = 'layout-center__right'
  const scrollElement = document.documentElement

  const articleStore = useArticleStore()
  const { currentArticle } = storeToRefs(articleStore)
  const headerStore = useHeaderStore()
  
  // 响应式的文章内容
  const articleContent = computed(() => {
    const found = articleStore.findArticleById(articleId)
    if (found?.content) return found.content
    
    if (currentArticle.value && 
        (currentArticle.value.id === articleId || currentArticle.value.id === parseInt(articleId))) {
      return currentArticle.value.content || ''
    }
    return ''
  })

  // 如果文章不存在，尝试获取
  watch(() => articleId, async (id) => {
    if (id) {
      try {
        // 先尝试从列表查找
        const found = articleStore.findArticleById(id)
        const currentId = currentArticle.value?.id
        const idNum = parseInt(id)
        
        // 如果列表中没有，且当前文章不匹配，则获取
        if (!found && (!currentArticle.value || (currentId !== idNum && String(currentId) !== id))) {
          await articleStore.qryArticleById(id)
        }
      } catch (error) {
        console.error('Error fetching article:', error)
      }
    }
  }, { immediate: true })

  const Preview = shallowRef<Component | null>(null)
  const Catalog = shallowRef<Component | null>(null)
  const sideRightEl = shallowRef<HTMLElement | null>(null)
  const catalogStyle = shallowRef<CSSProperties>()

  watchFn<HTMLElement>(() => document.querySelector(`#${rightSideId}`) as HTMLElement, result =>
  {
    sideRightEl.value = result
    const top = (headerStore.height || TOP_NAV_HEIGHT_PX) + 20
    catalogStyle.value = {
      width: result.clientWidth + 'px',
      height: '400px',
      overflowY:'auto',
      position: 'fixed',
      top: top ? top + 'px' : 'unset'
    }
  })

  // 使用 ref 来存储 articleId，确保组件能响应式更新
  const previewArticleId = ref(articleId)
  
  // 监听 articleId 变化，更新 previewArticleId
  watch(() => articleId, (newId) => {
    previewArticleId.value = newId
  })

  // 创建 Preview 组件，使用 key 强制重新渲染
  Preview.value = markRaw(defineComponent({
    name: 'Preview',
    setup()
    {
      const articleStore = useArticleStore()
      const route = useRoute()
      const { currentArticle: currentArticleRef } = storeToRefs(articleStore)
      
      // 监听路由变化，获取文章
      watch(() => route.params.id, async (id) => {
        if (id) {
          try {
            const found = articleStore.findArticleById(id as string)
            const currentId = currentArticleRef.value?.id
            const idNum = parseInt(id as string)
            
            if (!found && (!currentArticleRef.value || (currentId !== idNum && String(currentId) !== id))) {
              await articleStore.qryArticleById(id as string)
            }
          } catch (error) {
            console.error('Error fetching article in Preview component:', error)
          }
        }
      }, { immediate: true })
      
      // 响应式的文章内容
      const content = computed(() => {
        const found = articleStore.findArticleById(route.params.id as string)
        if (found?.content) return found.content
        
        if (currentArticleRef.value && 
            (currentArticleRef.value.id === route.params.id || 
             currentArticleRef.value.id === parseInt(route.params.id as string))) {
          return currentArticleRef.value.content || ''
        }
        return ''
      })

      // 使用 key 确保内容变化时重新渲染
      return () => (
        <MdPreview 
          key={`preview-${route.params.id}-${content.value.length}`}
          id={id} 
          modelValue={content.value} 
        />
      )
    }
  }))

  Catalog.value = markRaw(defineComponent({
    name: 'Catalog',
    setup()
    {
      return () => (
        <>
          {
            sideRightEl.value && (
              <Teleport to={sideRightEl.value}>
                <MdCatalog style={catalogStyle.value} editorId={id} scrollElement={scrollElement} />
              </Teleport>
            )
          }
        </>
      )
    }
  }))

  return {
    Preview,
    Catalog,
    articleContent
  }
}
