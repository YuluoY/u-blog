<template>
  <div class="drawer-test-container">
    <h2>Drawer 组件动画测试</h2>
    <div class="button-group">
      <u-button type="primary" @click="openDrawer('right')">右侧抽屉</u-button>
      <u-button type="success" @click="openDrawer('left')">左侧抽屉</u-button>
      <u-button type="warning" @click="openDrawer('top')">顶部抽屉</u-button>
      <u-button type="danger" @click="openDrawer('bottom')">底部抽屉</u-button>
    </div>

    <u-drawer
      v-model="visible"
      :title="`抽屉标题 (${currentPlacement})`"
      :placement="currentPlacement"
      :width="400"
      :height="300"
      @open="handleOpen"
      @close="handleClose"
    >
      <div class="drawer-content">
        <p>这是一个从 <strong>{{ currentPlacement }}</strong> 方向滑出的抽屉组件</p>
        <p>进入和退出都应该有平滑的滑动动画</p>
        <u-button @click="visible = false">关闭抽屉</u-button>
      </div>
    </u-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom'

const visible = ref(false)
const currentPlacement = ref<DrawerPlacement>('right')

const openDrawer = (placement: DrawerPlacement) => {
  currentPlacement.value = placement
  visible.value = true
}

const handleOpen = () => {
  console.log('Drawer opened')
}

const handleClose = () => {
  console.log('Drawer closed')
}
</script>

<style>
#app, body {
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
}

.drawer-test-container {
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.button-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.drawer-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
