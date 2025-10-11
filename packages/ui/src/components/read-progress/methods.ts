import { h, ref, render } from 'vue'
import type { UReadProgressExposes, UReadProgressProps } from './types'
import ReadProgress from './src/ReadProgress.vue'

const ReadProgressFn = (props: UReadProgressProps) =>
{
  const progressRef = ref<UReadProgressExposes | null>(null)
  render(h(ReadProgress, {
    ...props,
    ref: (e: any) => (progressRef.value = e)
  }), document.body)
  return progressRef
}

export default ReadProgressFn