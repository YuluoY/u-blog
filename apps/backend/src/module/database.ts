import { tryit } from '@u-blog/utils'
import { DataSource, type DataSourceOptions } from 'typeorm'

export interface DbOptions {
  database: DataSourceOptions
}

export class Database {
  
  private dataSource: DataSource

  constructor(opts: DbOptions)
  {
    this.__init(opts)
  }

  __init(opts: DbOptions)
  {
    this.dataSource = new DataSource(opts.database)
  }

  async start()
  {
    const [err, data] = await tryit<DataSource>(() => this.dataSource.initialize())
    if (err)
      console.error(err)
    return data
  }
}