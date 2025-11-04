import { tryit } from '@u-blog/utils'
import { DataSource, type DataSourceOptions } from 'typeorm'

export interface DbOptions {
  database: DataSourceOptions
}

export interface IDatabase {
  getDataSource(): DataSource
}

export class Database implements IDatabase {
  
  private dataSource: DataSource

  constructor(opts: DbOptions)
  {
    this.__init(opts)
  }

  private __init(opts: DbOptions)
  {
    this.dataSource = new DataSource(opts.database)
  }

  getDataSource(): DataSource
  {
    return this.dataSource
  }

  async start(): Promise<DataSource>
  {
    const [err, data] = await tryit<DataSource, Error>(() => this.dataSource.initialize())
    if (err)
      throw err
    return data
  }
}