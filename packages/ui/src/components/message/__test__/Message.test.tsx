import { nextTick } from 'vue'
import { describe, expect, test } from 'vitest'
import { MessageFn, closeAll } from '../methods'

const rAf = async() =>
{
  return new Promise(resolve =>
  {
    requestAnimationFrame(() =>
    {
      requestAnimationFrame(async() =>
      {
        resolve(null)
        await nextTick()
      })
    })
  })
}

describe('UMessage 组件覆盖测试', () =>
{

  test('message函数式用法测试', async() =>
  {
    const handler = MessageFn({ message: 'hello world', duration: 0 })
    await rAf()
    expect(document.body.querySelector('.u-message')).toBeTruthy()
    handler.close()
    await rAf()
    expect(document.body.querySelector('.u-message')).toBeFalsy()
  })

  test('message函数式用法多次调用测试', async() =>
  {
    MessageFn({ message: 'hello world', duration: 0 })
    MessageFn({ message: 'hello world1', duration: 0 })
    await rAf()
    expect(document.body.querySelectorAll('.u-message').length).toBe(2)
    closeAll()
    await rAf()
    expect(document.body.querySelector('.u-message')).toBeFalsy()
  })
})