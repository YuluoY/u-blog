import { ref } from 'vue'

/** 全局订阅弹窗可见状态（任意组件均可触发） */
const subscribeModalVisible = ref(false)

export function useSubscribe() {
  function openSubscribeModal() {
    subscribeModalVisible.value = true
  }

  function closeSubscribeModal() {
    subscribeModalVisible.value = false
  }

  return {
    subscribeModalVisible,
    openSubscribeModal,
    closeSubscribeModal,
  }
}
