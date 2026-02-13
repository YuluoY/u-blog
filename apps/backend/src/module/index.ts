import { DATABASE } from '@/constants'
import { Database, type DbOptions } from './database'
import { type Application } from 'express'
import { initDefaultUser, initSeedData } from '@/service/init'

export default {
  install(app: Application, opts: DbOptions)
  {
    const database = new Database(opts)
    app.locals[DATABASE] = database
    database.start().then(async (dataSource) => {
      console.log('Database connected')
      // 初始化默认用户
      await initDefaultUser(dataSource)
      
      // 根据环境变量决定是否初始化假数据
      const shouldInitSeedData = process.env.INIT_SEED_DATA === 'true'
      if (shouldInitSeedData) {
        await initSeedData(dataSource)
      } else {
        console.log('ℹ️  跳过假数据初始化 (INIT_SEED_DATA=false)\n')
      }
    }).catch((err) => {
      console.error('Database connection failed', err)
    })
    return database
  }
}
