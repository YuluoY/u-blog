/**
 * 蜂窝六边形网格交互系统
 *
 * 负责：
 * - 响应式网格布局计算（含偏移行蜂窝排列）
 * - 邻居关系预计算（一阶六方向）
 * - 节点状态管理（idle / hovered / near / pressed / focus-visible / dimmed）
 * - will-change 生命周期管理
 * - 触控 / 桌面自适应
 * - 入场动画 stagger 距离计算
 */
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  nextTick,
  type Ref,
  type ComputedRef,
} from 'vue'

/* ---------- 类型 ---------- */

export interface HoneycombItem {
  id: number
  [key: string]: any
}

export interface CellPosition {
  row: number
  col: number
  x: number
  y: number
  /** 距离网格视觉中心的归一化距离 (0–1)，用于入场 stagger */
  normalizedDist: number
}

export type NodeState = 'idle' | 'hovered' | 'near' | 'pressed' | 'focus-visible' | 'dimmed'

/** 单格：业务项 + 布局坐标 + 展示用色相 */
export type HoneycombCell<T extends HoneycombItem = HoneycombItem> = T & CellPosition & { hue: number }

/* ---------- 色相调色板（12 种低饱和差异色） ---------- */
const HEX_HUES = [215, 260, 330, 165, 25, 290, 140, 50, 195, 310, 180, 350]

/* ---------- 邻居偏移量（偶/奇行的六方向） ---------- */
const EVEN_DELTAS = [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]] as const
const ODD_DELTAS = [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]] as const

/* ---------- Composable ---------- */

export function useHoneycombGrid<T extends HoneycombItem>(
  containerRef: Ref<HTMLElement | null>,
  items: ComputedRef<T[]>,
)
{
  /* ---- 响应式状态 ---- */
  const containerWidth = ref(900)
  const hoveredId = ref<number | null>(null)
  const pressedId = ref<number | null>(null)
  const focusedId = ref<number | null>(null)
  const activeId = ref<number | null>(null) // 移动端点击聚焦
  const isTouch = ref(false)
  const hasEntered = ref(false)

  let resizeOb: ResizeObserver | null = null
  let hoverTimer: ReturnType<typeof setTimeout> | null = null

  /* ---- 响应式六边形尺寸 ---- */
  const hexW = computed(() =>
  {
    if (containerWidth.value <= 480) return 90
    if (containerWidth.value <= 700) return 110
    return 130
  })
  const hexH = computed(() => Math.round(hexW.value * 1.1547))
  const hexGap = computed(() => (containerWidth.value <= 480 ? 4 : 6))

  /* ---- 网格布局 + 距离计算 ---- */
  const cellPositions = computed<CellPosition[]>(() =>
  {
    const W = hexW.value
    const H = hexH.value
    const G = hexGap.value
    const maxCols = Math.max(2, Math.floor((containerWidth.value + G) / (W + G)))
    const rowH = H * 0.75 + G
    const colsInRow = (r: number) => (r % 2 === 0 ? maxCols : Math.max(1, maxCols - 1))

    let row = 0
    let col = 0
    const cells: CellPosition[] = items.value.map(() =>
    {
      if (col >= colsInRow(row))
      {
        row++
        col = 0
      }
      const odd = row % 2 === 1
      const x = col * (W + G) + (odd ? (W + G) / 2 : 0)
      const y = row * rowH
      const cell: CellPosition = { row, col, x, y, normalizedDist: 0 }
      col++
      return cell
    })

    // 计算视觉中心 → 归一化距离 (用于入场 stagger)
    if (cells.length > 0)
    {
      const cx = cells.reduce((s, c) => s + c.x, 0) / cells.length + W / 2
      const cy = cells.reduce((s, c) => s + c.y, 0) / cells.length + H / 2
      let maxDist = 0
      cells.forEach(c =>
      {
        const d = Math.hypot(c.x + W / 2 - cx, c.y + H / 2 - cy)
        if (d > maxDist) maxDist = d
      })
      if (maxDist > 0)
      {
        cells.forEach(c =>
        {
          c.normalizedDist =
            Math.hypot(c.x + W / 2 - cx, c.y + H / 2 - cy) / maxDist
        })
      }
    }

    return cells
  })

  /** 合并 item 数据 + 布局位置 + 色相 */
  const cellLayout = computed((): HoneycombCell<T>[] =>
    items.value.map((item, i) => ({
      ...item,
      ...cellPositions.value[i],
      hue: HEX_HUES[i % HEX_HUES.length],
    })),
  )

  /* ---- 邻居关系预计算 ---- */
  const neighborMap = computed(() =>
  {
    const map = new Map<number, Set<number>>()
    const lookup = new Map<string, number>()
    cellPositions.value.forEach((c, i) =>
    {
      lookup.set(`${c.row},${c.col}`, items.value[i].id)
    })

    cellPositions.value.forEach((cell, i) =>
    {
      const id = items.value[i].id
      const neighbors = new Set<number>()
      const deltas = cell.row % 2 === 1 ? ODD_DELTAS : EVEN_DELTAS
      for (const [dr, dc] of deltas)
      {
        const nid = lookup.get(`${cell.row + dr},${cell.col + dc}`)
        if (nid !== undefined) neighbors.add(nid)
      }
      map.set(id, neighbors)
    })

    return map
  })

  /* ---- 节点状态 ---- */
  function getNodeState(id: number): NodeState
  {
    if (pressedId.value === id) return 'pressed'
    if (focusedId.value === id) return 'focus-visible'
    if (hoveredId.value === id) return 'hovered'
    if (hoveredId.value !== null || focusedId.value !== null)
    {
      const refId = hoveredId.value ?? focusedId.value!
      const neighbors = neighborMap.value.get(refId)
      if (neighbors?.has(id)) return 'near'
      return 'dimmed'
    }
    return 'idle'
  }

  /* ---- 网格尺寸 ---- */
  const gridWidth = computed(() =>
  {
    if (cellPositions.value.length === 0) return 0
    return Math.max(...cellPositions.value.map(c => c.x)) + hexW.value
  })
  const gridHeight = computed(() =>
  {
    if (cellPositions.value.length === 0) return 0
    return Math.max(...cellPositions.value.map(c => c.y)) + hexH.value
  })

  /* ---- 事件处理 ---- */
  function onCellEnter(id: number)
  {
    if (isTouch.value) return
    if (hoverTimer)
    {
      clearTimeout(hoverTimer); hoverTimer = null
    }
    hoveredId.value = id
  }

  function onCellLeave()
  {
    if (isTouch.value) return
    hoverTimer = setTimeout(() =>
    {
      hoveredId.value = null; hoverTimer = null
    }, 150)
  }

  function onTipEnter()
  {
    if (hoverTimer)
    {
      clearTimeout(hoverTimer); hoverTimer = null
    }
  }

  function onTipLeave()
  {
    hoveredId.value = null
  }

  function onCellPress(id: number)
  {
    pressedId.value = id
  }

  function onCellRelease()
  {
    pressedId.value = null
  }

  function onCellFocus(id: number)
  {
    focusedId.value = id
  }

  function onCellBlur()
  {
    focusedId.value = null
  }

  /** 统一点击：桌面直跳、移动端先展后跳 */
  function onCellClick(e: Event, cell: Pick<HoneycombCell<T>, 'id' | 'url'>)
  {
    if (isTouch.value)
    {
      if (activeId.value === cell.id)
      
        window.open(cell.url, '_blank', 'noopener,noreferrer')
      
      else
      
        activeId.value = cell.id
      
    }
    else
    
      window.open(cell.url, '_blank', 'noopener,noreferrer')
    
  }

  /* ---- 生命周期 ---- */
  onMounted(() =>
  {
    isTouch.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    nextTick(() =>
    {
      if (containerRef.value)
      {
        containerWidth.value = containerRef.value.clientWidth
        resizeOb = new ResizeObserver(entries =>
        {
          containerWidth.value = entries[0].contentRect.width
        })
        resizeOb.observe(containerRef.value)
      }
      // 延迟触发入场动画标记
      requestAnimationFrame(() =>
      {
        hasEntered.value = true
      })
    })
  })

  onUnmounted(() =>
  {
    resizeOb?.disconnect()
    if (hoverTimer) clearTimeout(hoverTimer)
  })

  return {
    // 布局
    containerWidth,
    hexW,
    hexH,
    hexGap,
    cellLayout,
    gridWidth,
    gridHeight,
    // 状态
    hoveredId,
    pressedId,
    focusedId,
    activeId,
    isTouch,
    hasEntered,
    // 方法
    getNodeState,
    onCellEnter,
    onCellLeave,
    onTipEnter,
    onTipLeave,
    onCellPress,
    onCellRelease,
    onCellFocus,
    onCellBlur,
    onCellClick,
  }
}
