import { IBaseFields, IBaseSchema } from "@/base";
import { IRoute } from "./route";

export interface ISetting<T = any> extends IBaseSchema, Pick<IBaseFields, 'id'> {
  key: string
  value: T
  desc?: string
  routeId?: number
  route?: IRoute
}

/**
 * 前 --> 后
 */
export interface ISettingDto<T = any> extends Omit<ISetting<T>, keyof IBaseFields | 'deletedAt' | 'route'> {}

/**
 * 前 <-- 后
 */
export interface ISettingVo<T = any> extends Omit<ISetting<T>, 'deletedAt'> {}