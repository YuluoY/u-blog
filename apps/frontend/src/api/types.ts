export type ApiMethod<T = any> = (...args: any[]) => Promise<T>
