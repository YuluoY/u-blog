<template>
  <div
    v-if="!prefersReducedMotion"
    class="snowfall"
    :style="rootStyle"
    aria-hidden="true"
  >
    <div
      v-for="flake in flakes"
      :key="flake.id"
      class="snowfall__flake"
      :class="{ 'snowfall__flake--paused': flake.paused }"
      :style="flakeStyle(flake)"
      @mouseenter="onEnter(flake)"
      @mouseleave="onLeave(flake)"
    >
      <svg
        class="snowfall__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <!-- 六瓣雪花：12 条射线（6 主枝 + 6 短枝），中心 (12,12) -->
        <path
          d="M12 12 L12 2 M12 12 L17 3 M12 12 L21 7 M12 12 L22 12 M12 12 L21 17 M12 12 L17 21 M12 12 L12 22 M12 12 L7 21 M12 12 L3 17 M12 12 L2 12 M12 12 L3 7 M12 12 L7 3"
        />
      </svg>
      <Transition name="snowfall-tip">
        <div
          v-if="flake.paused && flake.message"
          class="snowfall__tip"
        >
          {{ flake.message }}
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { DEFAULT_MESSAGES } from './messages'
import type { SnowfallOptions, FlakeState } from './types'

const props = withDefaults(
  defineProps<{
    options?: SnowfallOptions
  }>(),
  { options: () => ({}) }
)

const count = computed(() => props.options?.count ?? 48)
const sizeMin = computed(() => Math.max(2, Math.min(24, props.options?.sizeMin ?? 4)))
const sizeMax = computed(() => Math.max(2, Math.min(24, props.options?.sizeMax ?? 10)))
const durationMin = computed(() => Math.max(3, Math.min(60, props.options?.durationMin ?? 10)))
const durationMax = computed(() => Math.max(3, Math.min(60, props.options?.durationMax ?? 20)))
const distribution = computed(() => Math.max(0, Math.min(100, props.options?.distribution ?? 100)))
const themeColors = computed(() => props.options?.themeColors ?? [
  'var(--u-primary, #409eff)',
  'var(--u-success, #67c23a)',
  'var(--u-warning, #e6a23c)',
  'var(--u-danger, #f56c6c)',
  'var(--u-info, #909399)'
])
const messages = computed(() => props.options?.messages ?? DEFAULT_MESSAGES)
const zIndex = computed(() => props.options?.zIndex ?? 9998)

const rootStyle = computed(() => ({
  zIndex: zIndex.value
}))

const flakes = ref<FlakeState[]>([])

const prefersReducedMotion = ref(true)

function pickMessage(): string {
  const list = messages.value
  return list[Math.floor(Math.random() * list.length)]
}

function buildFlakes() {
  const n = count.value
  const smin = sizeMin.value
  const smax = Math.max(smin, sizeMax.value)
  const dmin = durationMin.value
  const dmax = Math.max(dmin, durationMax.value)
  const dist = distribution.value
  const list: FlakeState[] = []
  for (let i = 0; i < n; i++) {
    const leftPct = dist === 0 ? 50 : 50 + (Math.random() - 0.5) * dist
    const left = Math.max(0, Math.min(100, leftPct))
    list.push({
      id: i,
      left,
      size: smin + Math.random() * (smax - smin),
      duration: dmin + Math.random() * (dmax - dmin),
      delay: Math.random() * (dmax + 5),
      colorPhase: Math.random() * 100,
      paused: false,
      message: ''
    })
  }
  flakes.value = list
}

function flakeStyle(flake: FlakeState) {
  const colors = themeColors.value
  const len = colors.length
  const idx = Math.floor(flake.colorPhase) % len
  const nextIdx = (idx + 1) % len
  return {
    '--snow-left': `${flake.left}%`,
    '--snow-size': `${flake.size}px`,
    '--snow-duration': `${flake.duration}s`,
    '--snow-delay': `-${flake.delay}s`,
    '--snow-color-delay': `${(flake.colorPhase % 10) * 1.2}s`,
    '--snow-color-a': colors[idx],
    '--snow-color-b': colors[nextIdx]
  }
}

function onEnter(flake: FlakeState) {
  flake.paused = true
  if (!flake.message) flake.message = pickMessage()
}

function onLeave(flake: FlakeState) {
  flake.paused = false
}

onMounted(() => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.value = mq.matches
    mq.addEventListener('change', (e) => {
      prefersReducedMotion.value = e.matches
    })
  } else {
    prefersReducedMotion.value = false
  }
  if (!prefersReducedMotion.value) buildFlakes()
})

watch(
  () => [
    count.value,
    sizeMin.value,
    sizeMax.value,
    durationMin.value,
    durationMax.value,
    distribution.value
  ],
  () => {
    if (!prefersReducedMotion.value) buildFlakes()
  }
)
</script>

<style scoped>
.snowfall {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.snowfall__flake {
  position: absolute;
  left: var(--snow-left);
  top: -2%;
  width: var(--snow-size);
  height: var(--snow-size);
  pointer-events: auto;
  cursor: default;
  animation: snowfall-fall var(--snow-duration) var(--snow-delay) linear infinite;
}

.snowfall__flake--paused {
  animation-play-state: paused;
}

.snowfall__icon {
  display: block;
  width: 100%;
  height: 100%;
  color: var(--snow-color-a);
  filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.5));
  animation: snowfall-color 12s linear infinite;
  animation-delay: calc(-1 * var(--snow-color-delay, 0s));
}

.snowfall__tip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  transform: translateX(-50%);
  min-width: 80px;
  max-width: 160px;
  padding: 6px 10px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--u-text-1, #303133);
  background: var(--u-background-2, #fff);
  border: 1px solid var(--u-border-1, #dcdfe6);
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  white-space: normal;
  text-align: center;
  pointer-events: none;
}

.snowfall-tip-enter-active,
.snowfall-tip-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.snowfall-tip-enter-from,
.snowfall-tip-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}

@keyframes snowfall-fall {
  to {
    transform: translateY(105vh);
  }
}

@keyframes snowfall-color {
  0% {
    color: var(--snow-color-a);
  }
  25% {
    color: var(--snow-color-b);
  }
  50% {
    color: var(--snow-color-a);
  }
  75% {
    color: var(--snow-color-b);
  }
  100% {
    color: var(--snow-color-a);
  }
}
</style>

