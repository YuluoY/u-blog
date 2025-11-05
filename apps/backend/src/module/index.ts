import { DATABASE } from '@/constants'
import { Database, type DbOptions } from './database'
import { type Application } from 'express'

export default {
  install(app: Application, opts: DbOptions)
  {
    const database = new Database(opts)
    app.locals[DATABASE] = database
    database.start().then(() => {
      console.log('Database connected')
    }).catch((err) => {
      console.error('Database connection failed', err)
    })
    return database
  }
}
