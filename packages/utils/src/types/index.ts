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
