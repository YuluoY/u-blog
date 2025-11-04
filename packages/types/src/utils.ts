/**
 * 通用工具类型定义
 */

/**
 * 从类型中提取可选属性
 */
export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never
}[keyof T]

/**
 * 从类型中提取必选属性
 */
export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K
}[keyof T]

/**
 * 获取一个类型中所有可选参数的类型
 */
export type GetOptionals<T extends object> = {
  [K in keyof T as T[K] extends Required<T>[K] ? never : K]: T[K]
}

/**
 * 获取一个类型中所有必选参数的类型
 */
export type GetRequired<T extends object> = {
  [K in keyof T as T[K] extends Required<T>[K] ? K : never]: T[K]
}

/**
 * 指定获取类型中的属性
 */
export type GetProps<T extends object, K extends keyof T> = {
  [P in K]: T[K]
}

/**
 * 函数类型
 */
export type Fn<T = any, R = any> = (...args: T[]) => R

/**
 * 异步函数类型
 */
export type AsyncFn<T = any, R = any> = (...args: T[]) => Promise<R>

/**
 * 可空类型
 */
export type Nullable<T> = T | null

/**
 * 可能未定义的类型
 */
export type Maybe<T> = T | undefined

/**
 * 可空且可能未定义的类型
 */
export type MaybeNull<T> = T | null | undefined

/**
 * 值类型（可以是值、函数或对象）
 */
export type ToValue<T = any> = T | (() => T) | { value: T }

/**
 * 深度只读
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

/**
 * 深度可选
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * 深度必选
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

/**
 * 提取 Promise 的返回值类型（兼容旧版 TypeScript）
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T

/**
 * 数组元素类型
 */
export type ArrayElement<T> = T extends ReadonlyArray<infer U> ? U : never

/**
 * 对象值类型
 */
export type ValueOf<T> = T[keyof T]

/**
 * 键的类型
 */
export type KeyOf<T> = keyof T

/**
 * 值类型（从值获取类型）
 */
export type ValueType<T> = T extends infer U ? U : never

