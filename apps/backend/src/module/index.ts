import { DATABASE } from '@/constants'
import { Database, type DbOptions } from './database'
import { type Application } from 'express'
import { initDefaultUser } from '@/service/init'

export default {
  install(app: Application, opts: DbOptions)
  {
    const database = new Database(opts)
    app.locals[DATABASE] = database
    database.start().then((dataSource) => {
      console.log('Database connected')
      // 初始化默认用户
      return initDefaultUser(dataSource)
    }).catch((err) => {
      console.error('Database connection failed', err)
    })
    return database
  }
}
