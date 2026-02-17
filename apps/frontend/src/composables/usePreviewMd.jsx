import { useAppStore } from '@/stores/app';
import { useArticleStore } from '@/stores/model/article';
import { watchFn } from '@u-blog/utils';
import { CTheme } from '@u-blog/model';
import { MdCatalog, MdPreview } from 'md-editor-v3';
import { defineComponent, watch, computed, shallowRef, markRaw } from 'vue';
import { storeToRefs } from 'pinia';
import 'md-editor-v3/lib/preview.css';
export const usePreviewMd = ({ articleId }) => {
    const id = 'preview-only';
    const scrollElement = shallowRef(undefined);
    watchFn(() => document.querySelector('.layout-base__main'), (el) => { scrollElement.value = el ?? undefined; });
    const articleStore = useArticleStore();
    const { currentArticle } = storeToRefs(articleStore);
    // 响应式的文章内容
    const articleContent = computed(() => {
        const found = articleStore.findArticleById(articleId);
        if (found?.content)
            return found.content;
        if (currentArticle.value &&
            (String(currentArticle.value.id) === articleId || currentArticle.value.id === parseInt(articleId, 10))) {
            return currentArticle.value.content || '';
        }
        return '';
    });
    // 如果文章不存在，尝试获取
    watch(() => articleId, async (id) => {
        if (id) {
            try {
                // 先尝试从列表查找
                const found = articleStore.findArticleById(id);
                const currentId = currentArticle.value?.id;
                const idNum = parseInt(id);
                // 如果列表中没有，且当前文章不匹配，则获取
                if (!found && (!currentArticle.value || (currentId !== idNum && String(currentId) !== id))) {
                    await articleStore.qryArticleById(id);
                }
            }
            catch (error) {
                console.error('Error fetching article:', error);
            }
        }
    }, { immediate: true });
    const Preview = shallowRef(null);
    const Catalog = shallowRef(null);
    const catalogStyle = {
        width: '100%',
        maxHeight: 'calc(100vh - 100px)',
        overflowY: 'auto'
    };
    // 创建 Preview 组件，使用 key 强制重新渲染；主题跟随应用主题
    Preview.value = markRaw(defineComponent({
        name: 'Preview',
        setup() {
            const articleStore = useArticleStore();
            const appStore = useAppStore();
            const route = useRoute();
            const { currentArticle: currentArticleRef } = storeToRefs(articleStore);
            const previewTheme = computed(() => appStore.theme === CTheme.DARK ? 'dark' : 'light');
            // 监听路由变化，获取文章
            watch(() => route.params.id, async (id) => {
                if (id) {
                    try {
                        const found = articleStore.findArticleById(id);
                        const currentId = currentArticleRef.value?.id;
                        const idNum = parseInt(id);
                        if (!found && (!currentArticleRef.value || (currentId !== idNum && String(currentId) !== id))) {
                            await articleStore.qryArticleById(id);
                        }
                    }
                    catch (error) {
                        console.error('Error fetching article in Preview component:', error);
                    }
                }
            }, { immediate: true });
            // 响应式的文章内容
            const content = computed(() => {
                const paramId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;
                const idStr = paramId != null ? String(paramId) : '';
                const found = idStr ? articleStore.findArticleById(idStr) : null;
                if (found?.content)
                    return found.content;
                if (currentArticleRef.value &&
                    (String(currentArticleRef.value.id) === idStr ||
                        currentArticleRef.value.id === parseInt(idStr, 10))) {
                    return currentArticleRef.value.content || '';
                }
                return '';
            });
            return () => (<MdPreview key={`preview-${route.params.id}-${content.value.length}-${previewTheme.value}`} id={id} modelValue={content.value} theme={previewTheme.value}/>);
        }
    }));
    Catalog.value = markRaw(defineComponent({
        name: 'Catalog',
        props: {
            scrollElement: { type: Object, default: undefined }
        },
        setup(props) {
            const appStore = useAppStore();
            const catalogTheme = computed(() => appStore.theme === CTheme.DARK ? 'dark' : 'light');
            const scrollEl = computed(() => props.scrollElement ?? document.documentElement);
            return () => (<MdCatalog style={catalogStyle} editorId={id} scrollElement={scrollEl.value} theme={catalogTheme.value}/>);
        }
    }));
    return {
        Preview,
        Catalog,
        articleContent,
        scrollElement
    };
};
