import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig, AxiosResponse } from 'axios'

// 对AxiosRequestConfig配置进行扩展
export interface IAppInterceptors<T = AxiosResponse> {
  requestSuccessFn?: (config: AxiosRequestConfig) => InternalAxiosRequestConfig | any
  requestFailureFn?: (err: any) => any
  responseSuccessFn?: (res: T) => T
  responseFailureFn?: (err: any) => any
}

export interface IAppRequestConfig<T = AxiosResponse> extends Partial<InternalAxiosRequestConfig> {
  interceptors?: IAppInterceptors<T>
}

// 拦截器: 蒙版Loading/token/修改配置

/**
 * AppRequest类
 * @class AppRequest
 * @param {IAppRequestConfig} config
 * @description AppRequest类
 * @example
 * ```js
 *  const request = new AppRequest({
 *    baseURL: '',
 *    timeout: 5000,
 *    interceptors: {
 *      requestSuccessFn(cfg) {
 *        return cfg
 *      },
 *      requestFailureFn(){},
 *      responseSuccessFn(){},
 *      responseFailureFn(){}
 *    }
 *  })
 * ```
 */
export class AppRequest
{
  instance: AxiosInstance

  // request实例 => axios的实例
  constructor(config: IAppRequestConfig)
  {
    this.instance = axios.create(config)

    // 每个instance实例都添加拦截器
    this.instance.interceptors.request.use(
      config =>
      {
        // loading/token
        return config
      },
      err =>
      {
        return err
      }
    )
    this.instance.interceptors.response.use(
      res =>
      {
        return res.data
      },
      err =>
      {
        return err
      }
    )

    // 针对特定的AppRequest实例添加拦截器
    this.instance.interceptors.request.use(config.interceptors?.requestSuccessFn, config.interceptors?.requestFailureFn)
    this.instance.interceptors.response.use(
      config.interceptors?.responseSuccessFn,
      config.interceptors?.responseFailureFn
    )
  }

  // 封装网络请求的方法
  // T => IHomeData
  request<T = any>(config: IAppRequestConfig<T>)
  {
    // 单次请求的成功拦截处理
    if (config.interceptors?.requestSuccessFn) config = config.interceptors.requestSuccessFn(config)

    // 返回Promise
    return new Promise<T>((resolve, reject) =>
    {
      this.instance
        .request<any, T>(config)
        .then(res =>
        {
          // 单词响应的成功拦截处理
          if (config.interceptors?.responseSuccessFn) res = config.interceptors.responseSuccessFn(res)

          resolve(res)
        })
        .catch(err =>
        {
          reject(err)
        })
    })
  }

  get<T = any>(config: IAppRequestConfig<T>)
  {
    return this.request({ ...config, method: 'GET' })
  }
  post<T = any>(config: IAppRequestConfig<T>)
  {
    return this.request({ ...config, method: 'POST' })
  }
  delete<T = any>(config: IAppRequestConfig<T>)
  {
    return this.request({ ...config, method: 'DELETE' })
  }
  patch<T = any>(config: IAppRequestConfig<T>)
  {
    return this.request({ ...config, method: 'PATCH' })
  }
  put<T = any>(config: IAppRequestConfig<T>)
  {
    return this.request({ ...config, method: 'PUT' })
  }
}
export default AppRequest
