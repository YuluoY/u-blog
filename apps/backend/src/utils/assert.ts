import { isNil } from "@u-blog/utils";

class Assert
{
  private _value: any
  private _message: string

  constructor()
  {
    return new Proxy(this, {
      apply: (target, thisArg, argumentsList) => {
        return target.assert.apply(thisArg, argumentsList)
      }
    })
  }
  
  assert()
  {

  }

  /**
   * 断言值是否定义
   * @param value - 值
   * @param message - 消息
   * @returns - Assert
   * @example
   * ```ts
   * const assert = new Assert()
   * assert.defined(1, '值不能为空').value // 1
   * assert.defined(undefined, '值不能为空').value // 抛出错误
   * ```
   */
  defined<T = any>(value: T, message: string): this
  {
    if (isNil(value))
      throw new Error(message)

    this._value = value
    this._message = message
    return this
  }

  bool<T = any>(value: T, message: string): this
  {
    if (typeof value !== 'boolean')
      throw new Error(message)

    this._value = value
    this._message = message
    return this
  }

  /**
   * 管道断言
   * @param fn - 函数
   * @returns - Assert
   * @example
   * ```ts
   * assert.defined(1, '值不能为空').pip(value => undefined).value // 抛出错误
   * ```
   */
  pip<T = any, R = any>(fn: (value: T) => R): this
  {
    this._value = this.defined<R>(fn(this._value), this._message).value
    return this
  }
  
  get value()
  {
    return this._value
  }

  set value(value: any)
  {
    this._value = value
  }
}

export default new Assert()