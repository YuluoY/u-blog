import { AppRequest } from '@u-blog/utils'

const request = new AppRequest({
  baseURL: import.meta.env.BASE_URL + '/api',
  timeout: 5000,
  interceptors: {
    requestSuccessFn(cfg)
    {
      return cfg
    }
  }
})

export default request
