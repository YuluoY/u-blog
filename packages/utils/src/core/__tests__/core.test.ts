import {
  convertRoutesToLevel,
  groupByProp,
  parseJSON,
  getType,
  cssGradientToECharts,
  setValue,
  getValue,
  watchFn,
  runFn,
  parseStrWithType,
  restoreValue
} from '@/core'

// convertRoutesToLevel 测试用例
test('convertRoutesToLevel', () =>
{
  const routes = [
    { id: 1, parentId: 0, name: 'home' },
    { id: 2, parentId: 1, name: 'home1' },
    { id: 3, parentId: 1, name: 'home2' },
    { id: 4, parentId: 2, name: 'home3' }
  ]
  const result = convertRoutesToLevel(routes, { fld: 'id', glFld: 'parentId', childFld: 'children' })
  expect(result).toEqual([
    {
      id: 1,
      parentId: 0,
      name: 'home',
      children: [
        { id: 2, parentId: 1, name: 'home1', children: [{ id: 4, parentId: 2, name: 'home3' }] },
        { id: 3, parentId: 1, name: 'home2' }
      ]
    }
  ])
})

// groupByProp 测试用例
test('groupByProp', () =>
{
  const array = [
    { name: 'hello world', age: 18 },
    { name: 'hello world', age: 20 }
  ]
  const result = groupByProp(array, 'name')
  expect(result).toEqual({ 'hello world': array })
})

// parseJSON 测试用例
test('parseJSON', () =>
{
  const result = parseJSON('{"name": "hello world"}')
  expect(result).toEqual({ name: 'hello world' })
})

// getType 测试用例
test('getType', () =>
{
  expect(getType(1)).toBe('number')
  expect(getType('1')).toBe('string')
  expect(getType([])).toBe('array')
  expect(getType({})).toBe('object')
})

// cssGradientToECharts 测试用例
test('cssGradientToECharts', () =>
{
  const result = cssGradientToECharts('linear-gradient(45deg, rgba(255, 0, 0, 1) 0%, rgba(0, 255, 0, 1) 100%)') as any
  expect(result.type).toBe('linear')
})

// setValue 测试用例
test('setValue', () =>
{
  const obj = { a: { b: { c: 1 } } }
  const [modifiedObj, key] = setValue(obj, 'a.b.c', 2)
  expect(obj.a.b.c).toBe(2)
  expect(modifiedObj).toEqual({ c: 2 })
  expect(key).toBe('c')
})

// getValue 测试用例
test('getValue', () =>
{
  const obj = { a: { b: { c: 1 } } }
  const value = getValue(obj, 'a.b.c')
  expect(value).toBe(1)
})

// watchFn 测试用例
test('watchFn', done =>
{
  // 测试一次调用
  const ready = { value: false }
  const condition = { value: false }
  const fn = () => condition.value
  const callback = () =>
  {
    ready.value = true
  }
  const cancel = watchFn(fn, callback, { delay: 100, limit: 1 })
  condition.value = true
  setTimeout(() =>
  {
    expect(ready.value).toBe(true)
    cancel()
    done()
  }, 150)

  // 测试limit调用次数
  const ready2 = { value: false }
  const condition2 = { value: false }
  const fn2 = () => condition2.value
  const callback2 = () =>
  {
    ready2.value = !ready2.value
  }
  const cancel2 = watchFn(fn2, callback2, { delay: 100, limit: 2 })
  condition2.value = true
  setTimeout(() =>
  {
    expect(ready2.value).toBe(true)
    setTimeout(() =>
    {
      expect(ready2.value).toBe(false)
      cancel2()
      done()
    }, 150)
  }, 150)
})

// runFn 测试用例
test('runFn', () =>
{
  const fn = () => 'test'
  const result = runFn(fn, null)
  expect(result).toBe('test')
})

// parseStrWithType 测试用例
test('parseStrWithType', () =>
{
  const str =
    '{a: 10, b: _ => {return 3}, c: "jhahah", d: null, e: undefined, f: [1,2,3,4], g: true, h: Infinity, i: -Infinity, j: NaN}'
  const obj = parseStrWithType(str)
  expect(obj.a).toBe(10)
  expect(Array.isArray(obj.f)).toBe(true)
  expect(obj.b()).toBe(3)
})

// restoreValue 测试用例
test('restoreValue', () =>
{
  expect(restoreValue('undefined')).toBe(undefined)
  expect(restoreValue('null')).toBe(null)
  expect(restoreValue('true')).toBe(true)
  expect(restoreValue('false')).toBe(false)
  expect(restoreValue('NaN')).toBe(NaN)
  expect(restoreValue('Infinity')).toBe(Infinity)
})
