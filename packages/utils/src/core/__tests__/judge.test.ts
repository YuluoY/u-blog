import {
  isPrimitive,
  hasWeightValue,
  isNull,
  isUndefined,
  isFunction,
  isObject,
  isPlainObject,
  isEmptyObject,
  isEmptyPlainObject,
  isString,
  isArray,
  isEmptyArray,
  isFloat,
  isNumber,
  isInteger,
  isJSONString,
  isStringNumber,
  isStringBoolean,
  isStringArray,
  isStringObject,
  isStringFunction,
  isWindows,
  isMacOS,
  isMobile,
  isPC,
  isURL,
  isEmail,
  isPhone,
  isQQ,
  isPromise,
  isAsyncComponent,
  isNullish
} from '@/core/judge'
import { defineAsyncComponent } from 'vue'

describe('Test the judge module', () =>
{
  test('isPrimitive', () =>
  {
    expect(isPrimitive(1)).toBe(true)
    expect(isPrimitive('1')).toBe(true)
    expect(isPrimitive(true)).toBe(true)
    expect(isPrimitive(null)).toBe(true)
    expect(isPrimitive(undefined)).toBe(true)
    expect(isPrimitive({})).toBe(false)
    expect(isPrimitive([])).toBe(false)
    expect(isPrimitive(() =>
    {})).toBe(false)
  })

  test('hasWeightValue', () =>
  {
    expect(hasWeightValue(1)).toBe(true)
    expect(hasWeightValue(0)).toBe(false)
    expect(hasWeightValue('1')).toBe(true)
    expect(hasWeightValue('')).toBe(false)
    expect(hasWeightValue(true)).toBe(true)
    expect(hasWeightValue(false)).toBe(false)
    expect(hasWeightValue(null)).toBe(false)
    expect(hasWeightValue(undefined)).toBe(false)
    expect(hasWeightValue({})).toBe(false)
    expect(hasWeightValue([])).toBe(false)
  })

  test('isNull', () =>
  {
    expect(isNull(null)).toBe(true)
    expect(isNull(undefined)).toBe(false)
  })

  test('isNullish', () =>
  {
    expect(isNullish(null)).toBe(true)
    expect(isNullish(undefined)).toBe(true)
    expect(isNullish(0)).toBe(false)
  })

  test('isUndefined', () =>
  {
    expect(isUndefined(undefined)).toBe(true)
    expect(isUndefined(null)).toBe(false)
  })

  test('isFunction', () =>
  {
    expect(isFunction(() =>
    {})).toBe(true)
    expect(isFunction(1)).toBe(false)
    expect(isFunction('1')).toBe(false)
  })

  test('isObject', () =>
  {
    expect(isObject({})).toBe(true)
    expect(isObject([])).toBe(true)
    expect(isObject(1)).toBe(false)
  })

  test('isPlainObject', () =>
  {
    expect(isPlainObject({})).toBe(true)
    expect(isPlainObject([])).toBe(false)
    expect(isPlainObject(1)).toBe(false)
  })

  test('isEmptyObject', () =>
  {
    expect(isEmptyObject({})).toBe(true)
    expect(isEmptyObject({ a: 1 })).toBe(false)
    expect(isEmptyObject([])).toBe(true)
  })

  test('isEmptyPlainObject', () =>
  {
    expect(isEmptyPlainObject({})).toBe(true)
    expect(isEmptyPlainObject({ a: 1 })).toBe(false)
    expect(isEmptyPlainObject([])).toBe(false)
  })

  test('isString', () =>
  {
    expect(isString('1')).toBe(true)
    expect(isString(1)).toBe(false)
    expect(isString(true)).toBe(false)
  })

  test('isArray', () =>
  {
    expect(isArray([1, 2, 3])).toBe(true)
    expect(isArray('1,2,3')).toBe(false)
  })

  test('isEmptyArray', () =>
  {
    expect(isEmptyArray([1, 2, 3])).toBe(false)
    expect(isEmptyArray([])).toBe(true)
  })

  test('isFloat', () =>
  {
    expect(isFloat(1)).toBe(false)
    expect(isFloat(1.1)).toBe(true)
    expect(isFloat('1.1')).toBe(false)
  })

  test('isNumber', () =>
  {
    expect(isNumber(1)).toBe(true)
    expect(isNumber(1.1)).toBe(true)
    expect(isNumber('1')).toBe(false)
    expect(isNumber('1.1')).toBe(false)
  })

  test('isInteger', () =>
  {
    expect(isInteger(1)).toBe(true)
    expect(isInteger(1.1)).toBe(false)
  })

  test('isJSONString', () =>
  {
    expect(isJSONString('{"name": "John", "age": 30}')).toBe(true)
    expect(isJSONString('{"name": "John", "age": 30,}')).toBe(false)
  })

  test('isStringNumber', () =>
  {
    expect(isStringNumber('123')).toBe(true)
    expect(isStringNumber('123.45')).toBe(true)
    expect(isStringNumber('abc')).toBe(false)
  })

  test('isStringBoolean', () =>
  {
    expect(isStringBoolean('true')).toBe(true)
    expect(isStringBoolean('false')).toBe(true)
    expect(isStringBoolean('abc')).toBe(false)
  })

  test('isStringArray', () =>
  {
    expect(isStringArray('[1, 2, 3]')).toBe(true)
    expect(isStringArray('[]')).toBe(true)
    expect(isStringArray('123')).toBe(false)
  })

  test('isStringObject', () =>
  {
    expect(isStringObject('{"name": "John", "age": 30}')).toBe(true)
    expect(isStringObject('{"name": "John", "age": 30,}')).toBe(true)
    expect(isStringObject('{name: "John", age: 30}')).toBe(true)
  })

  test('isStringFunction', () =>
  {
    expect(isStringFunction('function(){}')).toBe(true)
    expect(isStringFunction('()=>{}')).toBe(true)
    expect(isStringFunction('_=>{}')).toBe(true)
  })

  test('isWindows', () =>
  {
    expect(isWindows()).toBe(typeof navigator !== 'undefined' && /Win/i.test(navigator.platform))
  })

  test('isMacOS', () =>
  {
    expect(isMacOS()).toBe(typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform))
  })

  test('isMobile', () =>
  {
    const fakeNavigator = { userAgent: '' } as any
    // 测试移动设备
    fakeNavigator.userAgent =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75 Mobile/14E5239e Safari/602.1'
    expect(isMobile(fakeNavigator)).toBe(true)

    // 测试非移动设备
    fakeNavigator.userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
    expect(isMobile(fakeNavigator)).toBe(false)
  })

  test('isPC', () =>
  {
    expect(isPC()).toBe(!isMobile())
  })

  test('isURL', () =>
  {
    expect(isURL('https://www.baidu.com')).toBe(true)
    expect(isURL('www.baidu.com')).toBe(true)
    expect(isURL('baidu.com')).toBe(true)
    expect(isURL('baidu')).toBe(false)
  })

  test('isEmail', () =>
  {
    expect(isEmail('123456789@qq.com')).toBe(true)
  })

  test('isPhone', () =>
  {
    expect(isPhone('15727091626')).toBe(true)
    expect(isPhone('12345678901', true)).toBe(false)
  })

  test('isQQ', () =>
  {
    expect(isQQ('123456789')).toBe(true)
  })

  test('isPromise', () =>
  {
    expect(isPromise(Promise.resolve())).toBe(true)
  })

  test('isAsyncComponent', () =>
  {
    expect(isAsyncComponent(() => import('../index'))).toBe(false)
    expect(isAsyncComponent(import('../index'))).toBe(false)
    expect(isAsyncComponent(defineAsyncComponent(() => import('../index')))).toBe(true)
  })
})
