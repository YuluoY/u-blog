<!--
  CommentList 评论列表：扁平数据转树后渲染 CommentItem，内联回复状态由父组件传入。
-->
<template>
  <div class="u-comment-list">
    <!-- 加载态 -->
    <template v-if="loading">
      <div class="u-comment-list__loading">
        <u-icon icon="fa-solid fa-spinner" spin />
        <span>加载中...</span>
      </div>
    </template>

    <!-- 空态 -->
    <template v-else-if="!treeList.length">
      <div class="u-comment-list__empty">
        <u-icon icon="fa-regular fa-comment-dots" class="u-comment-list__empty-icon" />
        <span>{{ emptyText }}</span>
      </div>
    </template>

    <!-- 列表：根评论 + 其下所有回复扁平展示，仅一级左边距（参考抖音等） -->
    <template v-else>
      <div class="u-comment-list__count">
        共 <strong>{{ totalCount }}</strong> 条留言
      </div>
      <div
        v-for="root in treeList"
        :key="root.id"
        class="u-comment-list__block"
      >
        <u-comment-item
          :comment="root"
          :plain-content="plainContent"
          :replying-id="replyingId"
          :reply-content="replyContent"
          :reply-loading="replyLoading"
          :logged-in="loggedIn"
          :show-children="false"
          @reply="(c) => $emit('reply', c)"
          @reply-submit="(content, c) => $emit('reply-submit', content, c)"
          @reply-cancel="$emit('reply-cancel')"
          @update:reply-content="(v) => $emit('update:replyContent', v)"
          @scroll-to="(id) => $emit('scroll-to', id)"
        >
          <template v-if="$slots.avatar" #avatar>
            <slot name="avatar" />
          </template>
          <template v-if="$slots.content" #content>
            <slot name="content" />
          </template>
          <template v-if="$slots.actions" #actions>
            <slot name="actions" />
          </template>
        </u-comment-item>
        <div
          v-if="visibleRepliesOf(root).length"
          class="u-comment-item__children u-comment-list__replies"
        >
          <u-comment-item
            v-for="r in visibleRepliesOf(root)"
            :key="r.id"
            :comment="r"
            :plain-content="plainContent"
            :replying-id="replyingId"
            :reply-content="replyContent"
            :reply-loading="replyLoading"
            :logged-in="loggedIn"
            :depth="1"
            :show-children="false"
            @reply="(c) => $emit('reply', c)"
            @reply-submit="(content, c) => $emit('reply-submit', content, c)"
            @reply-cancel="$emit('reply-cancel')"
            @update:reply-content="(v) => $emit('update:replyContent', v)"
            @scroll-to="(id) => $emit('scroll-to', id)"
          >
            <template v-if="$slots.avatar" #avatar>
              <slot name="avatar" />
            </template>
            <template v-if="$slots.content" #content>
              <slot name="content" />
            </template>
            <template v-if="$slots.actions" #actions>
              <slot name="actions" />
            </template>
          </u-comment-item>
          <div
            v-if="replyFoldThreshold > 0 && foldedReplyCount(root) > 0"
            class="u-comment-list__fold"
          >
            <button
              v-if="!isExpanded(root.id)"
              type="button"
              class="u-comment-list__fold-btn"
              @click="expandRoot(root.id)"
            >
              {{ foldExpandText(root) }}
            </button>
            <button
              v-else
              type="button"
              class="u-comment-list__fold-btn"
              @click="collapseRoot(root.id)"
            >
              收起
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { UCommentItemData, UCommentListEmits, UCommentListProps } from '../types'
import { CCommentEmptyText, CCommentReplyFoldThreshold } from '../consts'
import UCommentItem from './CommentItem.vue'
import { UIcon } from '@/components/icon'

defineOptions({
  name: 'UCommentList'
})

const props = withDefaults(defineProps<UCommentListProps>(), {
  loading: false,
  emptyText: CCommentEmptyText,
  plainContent: true,
  replyingId: null,
  replyContent: '',
  replyLoading: false,
  loggedIn: false,
  replyFoldThreshold: CCommentReplyFoldThreshold
})

defineEmits<UCommentListEmits>()

/** 已展开的根评论 id 集合（回复超过阈值时点击「展开更多」后记录） */
const expandedRootIds = ref<Record<number, boolean>>({})

/**
 * 将扁平评论列表按 pid 转为树结构，根节点 pid 为 null/undefined
 */
function buildTree(items: UCommentItemData[]): UCommentItemData[] {
  if (!Array.isArray(items) || items.length === 0) return []
  const map = new Map<number, UCommentItemData & { children?: UCommentItemData[] }>()
  const roots: (UCommentItemData & { children?: UCommentItemData[] })[] = []
  items.forEach((item) => {
    const node = { ...item, children: [] as UCommentItemData[] }
    map.set(item.id, node)
  })
  items.forEach((item) => {
    const node = map.get(item.id)!
    const pid = item.pid ?? null
    if (pid == null || !map.has(pid)) {
      roots.push(node)
    } else {
      const parent = map.get(pid)!
      if (!parent.children) parent.children = []
      ;(node as UCommentItemData & { parent?: UCommentItemData }).parent = parent
      parent.children.push(node)
    }
  })
  return roots as UCommentItemData[]
}

/**
 * 将某条评论下的所有回复按树展开为扁平数组（DFS），保证只渲染一级左边距
 */
function flattenReplies(nodes: UCommentItemData[]): UCommentItemData[] {
  if (!nodes?.length) return []
  return nodes.flatMap((n) => [n, ...flattenReplies((n as { children?: UCommentItemData[] }).children ?? [])])
}

function flatRepliesOf(root: UCommentItemData & { children?: UCommentItemData[] }) {
  return flattenReplies(root.children ?? [])
}

/** 当前应展示的回复列表：超过阈值且未展开时只展示前 N 条 */
function visibleRepliesOf(root: UCommentItemData & { children?: UCommentItemData[] }) {
  const all = flatRepliesOf(root)
  const threshold = props.replyFoldThreshold ?? 0
  if (threshold <= 0 || all.length <= threshold || expandedRootIds.value[root.id]) return all
  return all.slice(0, threshold)
}

/** 折叠时隐藏的回复条数 */
function foldedReplyCount(root: UCommentItemData & { children?: UCommentItemData[] }) {
  const all = flatRepliesOf(root)
  const threshold = props.replyFoldThreshold ?? 0
  if (threshold <= 0 || all.length <= threshold) return 0
  return all.length - threshold
}

function isExpanded(rootId: number) {
  return !!expandedRootIds.value[rootId]
}

function expandRoot(rootId: number) {
  expandedRootIds.value = { ...expandedRootIds.value, [rootId]: true }
}

function collapseRoot(rootId: number) {
  const next = { ...expandedRootIds.value }
  delete next[rootId]
  expandedRootIds.value = next
}

function foldExpandText(root: UCommentItemData & { children?: UCommentItemData[] }) {
  const n = foldedReplyCount(root)
  return n > 0 ? `展开更多 ${n} 条回复` : ''
}

const treeList = computed(() => buildTree(props.list))

/** 原始列表总数 */
const totalCount = computed(() => props.list.length)
</script>

<style lang="scss">
@use '../styles/index.scss';
</style>
