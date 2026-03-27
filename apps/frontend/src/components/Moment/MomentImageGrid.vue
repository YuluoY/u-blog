<template>
  <!-- 图片展示组件：支持九宫格 / 合成长图 / 横向滚动三种布局 -->
  <div v-if="images?.length" :class="['moment-images', `moment-images--${layout}`]">
    <!-- 九宫格模式 -->
    <template v-if="layout === 'grid'">
      <div class="moment-images__grid" :class="gridClass">
        <div
          v-for="(url, i) in images"
          :key="i"
          class="moment-images__item"
          @click="handlePreview(i)"
        >
          <img :src="url" :alt="`图片 ${i + 1}`" class="moment-images__img" loading="lazy" />
        </div>
      </div>
    </template>

    <!-- 合成长图模式 -->
    <template v-else-if="layout === 'long'">
      <div class="moment-images__long">
        <img
          v-for="(url, i) in images"
          :key="i"
          :src="url"
          :alt="`图片 ${i + 1}`"
          class="moment-images__long-img"
          loading="lazy"
          @click="handlePreview(i)"
        />
      </div>
    </template>

    <!-- 横向滚动模式 -->
    <template v-else>
      <div class="moment-images__scroll" ref="scrollRef">
        <div
          v-for="(url, i) in images"
          :key="i"
          class="moment-images__scroll-item"
          @click="handlePreview(i)"
        >
          <img :src="url" :alt="`图片 ${i + 1}`" class="moment-images__scroll-img" loading="lazy" />
        </div>
      </div>
    </template>

    <!-- 图片预览遮罩 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="previewVisible" class="moment-images__overlay" @click.self="closePreview">
          <button class="moment-images__overlay-close" @click="closePreview" aria-label="关闭预览">
            <u-icon icon="fa-solid fa-xmark" />
          </button>
          <img :src="images[previewIndex]" class="moment-images__overlay-img" alt="预览" />
          <!-- 多图时显示左右切换 -->
          <template v-if="images.length > 1">
            <button
              class="moment-images__overlay-nav moment-images__overlay-nav--prev"
              :disabled="previewIndex === 0"
              @click="previewIndex = Math.max(0, previewIndex - 1)"
              aria-label="上一张"
            >
              <u-icon icon="fa-solid fa-chevron-left" />
            </button>
            <button
              class="moment-images__overlay-nav moment-images__overlay-nav--next"
              :disabled="previewIndex === images.length - 1"
              @click="previewIndex = Math.min(images.length - 1, previewIndex + 1)"
              aria-label="下一张"
            >
              <u-icon icon="fa-solid fa-chevron-right" />
            </button>
          </template>
          <span class="moment-images__overlay-counter">{{ previewIndex + 1 }} / {{ images.length }}</span>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { MomentImageLayout } from '@u-blog/model'

defineOptions({ name: 'MomentImageGrid' })

const props = defineProps<{
  /** 图片 URL 列表 */
  images?: string[] | null
  /** 展示布局模式 */
  layout?: MomentImageLayout | null
}>()

/** 实际使用的布局：默认九宫格 */
const layout = computed(() => props.layout || 'grid')

/**
 * 九宫格列数 class
 * 1 张：单图大图展示
 * 2 张：两列
 * 3 张：三列
 * 4 张：两列两行
 * 5-6 张：三列
 * 7-9 张：三列
 */
const gridClass = computed(() => {
  const count = props.images?.length ?? 0
  if (count === 1) return 'moment-images__grid--1'
  if (count === 2) return 'moment-images__grid--2'
  if (count === 4) return 'moment-images__grid--4'
  return 'moment-images__grid--3'
})

/* ---------- 图片预览 ---------- */
const previewVisible = ref(false)
const previewIndex = ref(0)
const scrollRef = ref<HTMLElement | null>(null)

function handlePreview(index: number) {
  previewIndex.value = index
  previewVisible.value = true
}

function closePreview() {
  previewVisible.value = false
}
</script>

<style scoped>
.moment-images {
  margin-top: 8px;
}

/* ===== 九宫格 ===== */
.moment-images__grid {
  display: grid;
  gap: 4px;
  border-radius: 8px;
  overflow: hidden;
}

.moment-images__grid--1 {
  grid-template-columns: 1fr;
  max-width: 400px;
}

.moment-images__grid--2 {
  grid-template-columns: repeat(2, 1fr);
  max-width: 400px;
}

.moment-images__grid--3 {
  grid-template-columns: repeat(3, 1fr);
}

.moment-images__grid--4 {
  grid-template-columns: repeat(2, 1fr);
  max-width: 400px;
}

.moment-images__item {
  position: relative;
  aspect-ratio: 1;
  cursor: pointer;
  overflow: hidden;
}

.moment-images__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.moment-images__item:hover .moment-images__img {
  transform: scale(1.05);
}

/* ===== 合成长图 ===== */
.moment-images__long {
  max-width: 400px;
  border-radius: 8px;
  overflow: hidden;
}

.moment-images__long-img {
  width: 100%;
  display: block;
  cursor: pointer;
}

/* ===== 横向滚动 ===== */
.moment-images__scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  padding-bottom: 4px;
  border-radius: 8px;
}

.moment-images__scroll-item {
  flex-shrink: 0;
  height: 200px;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
}

.moment-images__scroll-img {
  height: 100%;
  width: auto;
  display: block;
  transition: transform 0.2s ease;
}

.moment-images__scroll-item:hover .moment-images__scroll-img {
  transform: scale(1.05);
}

/* ===== 预览遮罩 ===== */
.moment-images__overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.85);
}

.moment-images__overlay-close {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 24px;
  color: #fff;
  background: none;
  border: none;
  cursor: pointer;
  z-index: 1;
}

.moment-images__overlay-img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 4px;
}

.moment-images__overlay-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 28px;
  color: #fff;
  background: rgba(0, 0, 0, 0.3);
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.moment-images__overlay-nav:hover {
  background: rgba(0, 0, 0, 0.6);
}

.moment-images__overlay-nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.moment-images__overlay-nav--prev {
  left: 16px;
}

.moment-images__overlay-nav--next {
  right: 16px;
}

.moment-images__overlay-counter {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

/* ===== 进出动画 ===== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
