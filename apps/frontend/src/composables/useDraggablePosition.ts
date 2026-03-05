/**
 * useDraggablePosition — 可拖拽定位 Composable
 * ──────────────────────────────────────────────
 * 让目标元素可被用户按住拖动到视口任意位置，
 * 位置信息缓存到 localStorage，下次打开自动恢复。
 *
 * 特性：
 * - 短按 (<200ms 不移动) 视为点击，不触发拖拽
 * - 拖拽过程中自动吸附到视口边界（避免拖出屏幕）
 * - 窗口 resize 时自动修正越界位置
 * - 使用 right/bottom 定位（适合右下角浮动按钮）
 */
import { ref, onMounted, onBeforeUnmount, watch, type Ref } from 'vue'

/** 位置信息（距视口右侧 / 底部的距离） */
export interface DraggablePosition {
  right: number
  bottom: number
}

/** 配置项 */
export interface UseDraggablePositionOptions {
  /** localStorage 缓存 key */
  storageKey: string
  /** 默认位置（未缓存时） */
  defaultPosition?: DraggablePosition
  /** 距视口边缘的最小间距 (px) */
  edgePadding?: number
}

const DEFAULT_POS: DraggablePosition = { right: 24, bottom: 24 }
const EDGE_PADDING = 8
/** 判定为点击（非拖拽）的最大移动像素 */
const CLICK_THRESHOLD = 4

export function useDraggablePosition(
  elRef: Ref<HTMLElement | null>,
  options: UseDraggablePositionOptions
)
{
  const {
    storageKey,
    defaultPosition = DEFAULT_POS,
    edgePadding = EDGE_PADDING,
  } = options

  /** 当前位置 */
  const position = ref<DraggablePosition>(loadPosition())
  /** 是否正在拖拽中 */
  const isDragging = ref(false)

  /* ─── 缓存读写 ─── */
  function loadPosition(): DraggablePosition
  {
    try
    {
      const raw = localStorage.getItem(storageKey)
      if (raw)
      {
        const parsed = JSON.parse(raw)
        if (typeof parsed.right === 'number' && typeof parsed.bottom === 'number')
        
          return parsed
        
      }
    }
    catch
    { /* 忽略解析错误 */ }
    return { ...defaultPosition }
  }

  function savePosition(pos: DraggablePosition)
  {
    try
    {
      localStorage.setItem(storageKey, JSON.stringify(pos))
    }
    catch
    { /* quota exceeded etc. */ }
  }

  /* ─── 边界修正 ─── */
  function clampPosition(pos: DraggablePosition): DraggablePosition
  {
    const el = elRef.value
    if (!el) return pos

    const vw = window.innerWidth
    const vh = window.innerHeight
    const rect = el.getBoundingClientRect()
    const w = rect.width
    const h = rect.height

    // right: 不能小于 edgePadding，不能让元素左边超出视口
    const maxRight = vw - w - edgePadding
    const right = Math.max(edgePadding, Math.min(pos.right, maxRight))

    // bottom: 不能小于 edgePadding，不能让元素上边超出视口
    const maxBottom = vh - h - edgePadding
    const bottom = Math.max(edgePadding, Math.min(pos.bottom, maxBottom))

    return { right, bottom }
  }

  /* ─── 拖拽逻辑 ─── */
  let startX = 0
  let startY = 0
  let startRight = 0
  let startBottom = 0
  let moved = false

  function onPointerDown(e: PointerEvent)
  {
    const el = elRef.value
    if (!el) return

    // 仅响应主键（左键 / 触摸首指）
    if (e.button !== 0) return

    e.preventDefault()
    el.setPointerCapture(e.pointerId)

    startX = e.clientX
    startY = e.clientY
    startRight = position.value.right
    startBottom = position.value.bottom
    moved = false

    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', onPointerUp)
  }

  function onPointerMove(e: PointerEvent)
  {
    const dx = e.clientX - startX
    const dy = e.clientY - startY

    // 检测是否真正移动（区分点击和拖拽）
    if (!moved && Math.abs(dx) < CLICK_THRESHOLD && Math.abs(dy) < CLICK_THRESHOLD)
    
      return
    
    moved = true
    isDragging.value = true

    // right/bottom 定位：鼠标向右 dx>0 → right 减小；鼠标向下 dy>0 → bottom 减小
    const newPos = clampPosition({
      right: startRight - dx,
      bottom: startBottom - dy,
    })
    position.value = newPos
  }

  function onPointerUp(e: PointerEvent)
  {
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)

    const el = elRef.value
    if (el) el.releasePointerCapture(e.pointerId)

    if (moved)
    {
      // 拖拽结束：保存位置
      savePosition(position.value)
      // 延迟重置 isDragging，让 click 事件判定可用
      requestAnimationFrame(() =>
      {
        isDragging.value = false
      })
    }
    else
    
      isDragging.value = false
    
  }

  /* ─── 窗口 resize 修正 ─── */
  function onResize()
  {
    position.value = clampPosition(position.value)
    savePosition(position.value)
  }

  /* ─── 生命周期绑定 ─── */
  onMounted(() =>
  {
    const el = elRef.value
    if (el)
    {
      el.addEventListener('pointerdown', onPointerDown)
      // 挂载后立即修正一次位置
      position.value = clampPosition(position.value)
    }
    window.addEventListener('resize', onResize)
  })

  onBeforeUnmount(() =>
  {
    const el = elRef.value
    if (el)
    
      el.removeEventListener('pointerdown', onPointerDown)
    
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('resize', onResize)
  })

  return {
    /** 当前位置（响应式） */
    position,
    /** 是否正在拖拽（可用于阻止 click 冒泡） */
    isDragging,
  }
}
