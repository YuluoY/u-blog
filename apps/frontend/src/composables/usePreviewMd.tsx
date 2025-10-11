import { useHeaderStore } from '@/stores/header'
import { useArticleStore } from '@/stores/model/article'
import { watchFn } from '@u-blog/utils'
import { MdCatalog, MdPreview } from 'md-editor-v3'
import { Teleport, type Component, type CSSProperties } from 'vue'
import 'md-editor-v3/lib/preview.css'

export const usePreviewMd = ({
  articleId
}: {
  articleId: string
}): {
  Preview: Component | null
  Catalog: Component | null
} =>
{
  const id = 'preview-only'
  const rightSideId = 'layout-center__right'
  const scrollElement = document.documentElement

  const { findArticleById } = useArticleStore()
  const headerStore = useHeaderStore()
  const article = computed(() => findArticleById(articleId))

  const Preview = shallowRef<Component | null>(null)
  const Catalog = shallowRef<Component | null>(null)
  const sideRightEl = shallowRef<HTMLElement | null>(null)
  const catalogStyle = shallowRef<CSSProperties>()

  watchFn<HTMLElement>(() => document.querySelector(`#${rightSideId}`) as HTMLElement, result =>
  {
    sideRightEl.value = result
    const top = headerStore.height + 20
    catalogStyle.value = {
      width: result.clientWidth + 'px',
      height: '400px',
      overflowY:'auto',
      position: 'fixed',
      top: top ? top + 'px' : 'unset'
    }
  })

  Preview.value = markRaw(defineComponent({
    name: 'Preview',
    setup()
    {
      return () => (
        <MdPreview id={id} modelValue={article.value?.content} />
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
    Catalog
  }
}