import { EntitySubscriberInterface, SoftRemoveEvent } from "typeorm";
import { Users } from "../schema/Users";
import { Article } from "../schema/Article";
import { Tag } from "../schema/Tag";
import { Likes } from "../schema/Likes";
import { Media } from "../schema/Media";
import { Category } from "../schema/Category";
import { Comment } from "../schema/Comment";

export class UsersSubscriber implements EntitySubscriberInterface<Users> {
  listenTo(): Function {
    return Users;
  }

  /**
   * 删除用户时，删除用户关联的文章
   */
  async beforeSoftRemove(event: SoftRemoveEvent<Users>): Promise<any> {
    const user = event.entity
    const manager = event.manager
    
    if (!user?.id)
      return void 0

    const Tables =
    [
      Article,      // 文章
      Tag,          // 标签
      Category,     // 分类
      Likes,        // 点赞
      Comment,      // 评论
      Media         // 媒体
    ]

    const payload = { userId: user.id } 

    for (const table of Tables) {
      await manager.softDelete(table, payload)
    }
  }
}