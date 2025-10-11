<template>
  <div>
    <u-button @click="handleChangeDirection">切换布局</u-button>
    <u-button @click="handleChangeDotPosition">随机排序dot位置</u-button>
  </div>
  <div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;">
    <!-- <u-timeline style="width: 40%;" :data="data" :direction="'vertical'"></u-timeline> -->
    <u-card style="width: 80%;" shadow="hover" @click="handleCardClick">
      <u-timeline :data="data" :direction="direction">
        <u-timeline-item v-for="item in data" :key="item.date?.toString()" v-bind="item" @dot-click="handleDotClick"></u-timeline-item>
      </u-timeline>
    </u-card>
  </div>

</template>

<script setup lang="ts">
import { faker } from '@faker-js/faker'
import type { UTimelineItemProps } from '@ucc-ui/components'
import { UDialogFn } from 'ucc-ui'
import { reactive, ref } from 'vue'
const data = reactive(Array.from({ length: 5 }, () => ({
  content: faker.lorem.paragraph(),
  // YYYY-MM-DD
  date: faker.date.recent().toISOString().split('T')[0],
  type: faker.helpers.arrayElement(['primary', 'success', 'warning', 'danger', 'info']),
  size: faker.helpers.arrayElement(['normal', 'large']),
  placement: faker.helpers.arrayElement(['top', 'bottom']),
  position: faker.helpers.arrayElement(['left', 'right', 'center']),
  hollow: faker.helpers.arrayElement([true, false])
})) as UTimelineItemProps[])

const handleDotClick = (evt: MouseEvent, item: UTimelineItemProps) =>
{
  console.log(evt, item)
}

const direction = ref<'horizontal' | 'vertical'>('horizontal')
const handleChangeDirection = () =>
{
  direction.value = direction.value === 'horizontal' ? 'vertical' : 'horizontal'

  setTimeout(() =>
  {
    data.push({
      content: faker.lorem.paragraph(),
      date: faker.date.recent().toISOString().split('T')[0],
      type: faker.helpers.arrayElement(['primary', 'success', 'warning', 'danger', 'info']),
      size: faker.helpers.arrayElement(['normal', 'large']),
    })
  }, 2000)
}

const handleChangeDotPosition = () =>
{
  data.forEach(item =>
  {
    item.position = faker.helpers.arrayElement(['left', 'right', 'center'])
    item.icon = faker.helpers.arrayElement(['', 'fas fa-home', 'fas fa-user', 'fas fa-search', 'fas fa-star', 'fas fa-heart'])
  })
}

const handleCardClick = () =>
{
  UDialogFn({
    title: 'asdasdas'
  })
}
</script>

<style>
#app, body {
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
}

.red {
  background-color: red;
  color: white;
}
.blue {
  background-color: blue;
  color: white;
}
.green {
  background-color: green;
  color: white;
}
.yellow {
  background-color: yellow;
  color: white;
}
.purple {
  background-color: purple;
  color: white;
}
</style>
