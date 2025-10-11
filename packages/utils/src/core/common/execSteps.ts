
export type StepResult<T> = T | Error
export type StepHandler<Prev, Out> = (input: Prev, done: (result: Out | Error) => void) => void | Promise<void>

export type StepOutputs<T extends readonly StepHandler<any, any>[]> = {
  [K in keyof T]: T[K] extends StepHandler<infer _, infer Out> ? StepResult<Out> : never
}

export interface ExecStepsOptions {
  timeout?: number
  isComplete?: boolean
}

/**
 * 顺序执行多个步骤函数，每个步骤函数接收上一步结果和 done 回调
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2025-06-08
 * @template T 步骤函数数组类型
 * @param   {T}                 steps     步骤函数数组
 * @param   {ExecStepsOptions}      [opts]    执行选项
 * @returns {StepOutputs<T>}              包含每个步骤结果的数组
 *
 * @example
 * // 1. 基本使用
 * const res = execSteps([
 *   (_, done) => done('123'),
 *   (val: string, done) => {
 *     console.log(val) // '123'
 *     done(val.length)
 *   }
 * ])
 * console.log(res) // ['123', 3]
 *
 * // 2. 提前结束
 * const res = execSteps([
 *   (_, done) => done(new Error('error')),
 *   (val, done) => done(val * 2) // 不会执行
 * ], { isComplete: false })
 * console.log(res) // [Error: error]
 *
 * // 3. 超时设置
 * const res = execSteps([
 *   (_, done) => setTimeout(() => done('data'), 2000),
 *   (val: string, done) => done(val.toUpperCase())
 * ], { timeout: 1000 })
 * console.log(res) // [Error: execSteps: step 0 timeout, undefined]
 */
export const execSteps = <T extends readonly StepHandler<any, any>[]>(
  steps: T,
  opts: ExecStepsOptions = {}
): StepOutputs<T> =>
{
  const { timeout, isComplete = true } = opts

  const results: unknown[] = Array(steps.length).fill(undefined)
  let hasError = false

  steps.reduce<Promise<void>>(async(prevPromise, step, index) =>
  {
    await prevPromise
    if (hasError && !isComplete) return

    // eslint-disable-next-line no-async-promise-executor
    return new Promise<void>(async resolve =>
    {
      let timer: NodeJS.Timeout | null = null

      const done = (result?: unknown) =>
      {
        timer && clearTimeout(timer)
        results[index] = result

        if (result instanceof Error)
          hasError = true
        resolve()
      }

      try
      {
        if (timeout) timer = setTimeout(() => done(new Error(`execSteps: step ${index} timeout`)), timeout)

        const input = index > 0 ? results[index - 1] : null
        await step(input, done)
      }
      catch (err)
      {
        done(err instanceof Error ? err : new Error(String(err)))
      }
    })
  }, Promise.resolve())

  return results as StepOutputs<T>
}
