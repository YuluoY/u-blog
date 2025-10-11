import { isPromise } from "../judge";

/**
 * 并发队列控制 - 保证并发数量始终是limit个
 * @author    Yuluo
 * @link      https://github.com/YuluoY
 * @date      2024-10-18
 * @param     {Function[] | Promise[]}                 tasks                      任务队列
 * @param     {object}                                 opts                       配置项
 * @param     {number}                                 [opts.limit=3]             最大并发数量，默认为3
 * @returns   {Promise<void>}
 * @example
 * ```ts
 * const tasks = [() => console.log('hello'), () => console.log('world')]
 * await toConcurrency(tasks) // hello world
 *
 * const tasks = [Promise.resolve('hello'), Promise.resolve('world')]
 * await toConcurrency(tasks) // hello world
 * ```
 */
export const concurRequest = async <T = any>(
  tasks: Function[] | Promise<any>[],
  opts: {
    limit?: number
  } = {}
): Promise<{ success: boolean; value: T | any }[]> =>
{
  const { limit = 3 } = opts
  tasks = tasks.map((t: any) => (isPromise(t) ? t : Promise.resolve(t))) as Promise<any>[]

  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async(resolve, reject) =>
  {
    if (tasks.length === 0)
      return resolve([])
    const results = [] as { success: boolean; value: T | any }[]
    let nextIndex = 0
    let count = 0
    const _request = async() =>
    {
      const i = nextIndex++
      const task = tasks[i] as Promise<T>
      try
      {
        results[i] = { success: true, value: await task }
      }
      catch (error)
      {
        results[i] = { success: false, value: error }
      }
    }
    if (nextIndex < tasks.length) _request()
    if (++count === tasks.length) return resolve(results)

    for (let i = 0; i < Math.min(limit, tasks.length); i++) _request()
  })
}
