import { DataSource } from 'typeorm'
import { CTable, CUserRole } from '@u-blog/model'

/**
 * 一次性迁移：将全局 setting 表中的 site_* 键迁移到 super_admin 用户的 user_setting 表中。
 *
 * 背景：site_name / site_description / site_keywords / site_favicon 原来存于全局 setting 表，
 * 现改为用户级设置（user_setting 表），每个用户可自定义网站标题等。
 * 未登录访客将回退读取 super_admin 的 user_setting 数据。
 *
 * 迁移逻辑：
 * 1. 检查全局 setting 表中是否存在 site_* 键
 * 2. 若存在，查出 super_admin 用户 ID
 * 3. 将 site_* 键值逐条 INSERT 到 user_setting（若已存在则跳过）
 * 4. 从全局 setting 表中删除已迁移的 site_* 键
 */
export async function migrateSiteSettingsToUserScope(ds: DataSource): Promise<void> {
  const SITE_KEYS = ['site_name', 'site_description', 'site_keywords', 'site_favicon']

  // 检查全局 setting 表中是否有待迁移的 site_* 数据
  const rows: Array<{ key: string; value: any; desc: string | null }> = await ds.query(
    `SELECT key, value, "desc" FROM "${CTable.SETTING}" WHERE key = ANY($1)`,
    [SITE_KEYS],
  )

  if (rows.length === 0) {
    // 没有需要迁移的数据
    return
  }

  // 查找 super_admin 用户 ID
  const [adminRow] = await ds.query(
    `SELECT id FROM "${CTable.USER}" WHERE role = $1 ORDER BY id ASC LIMIT 1`,
    [CUserRole.SUPER_ADMIN],
  )
  if (!adminRow) {
    console.warn('⚠️  未找到 super_admin 用户，跳过 site_* 设置迁移')
    return
  }
  const adminId: number = adminRow.id

  console.log(`🔄 迁移全局 site_* 设置 → user_setting (super_admin id=${adminId})`)

  // 使用事务保证 INSERT + DELETE 的原子性
  await ds.transaction(async (manager) => {
    // 逐条 INSERT，ON CONFLICT 跳过（避免重复迁移覆盖用户已修改的值）
    for (const row of rows) {
      // pg-node 从 JSONB 读出的值会被自动解析为 JS 基本类型（string/number 等），
      // 再插入另一个 JSONB 列时需要重新序列化为 JSON 字符串
      const jsonValue = JSON.stringify(row.value)
      await manager.query(
        `INSERT INTO "${CTable.USER_SETTING}" ("userId", key, value, "desc")
         VALUES ($1, $2, $3::jsonb, $4)
         ON CONFLICT ("userId", key) DO NOTHING`,
        [adminId, row.key, jsonValue, row.desc],
      )
    }

    // 删除已迁移的全局 setting 表数据
    await manager.query(
      `DELETE FROM "${CTable.SETTING}" WHERE key = ANY($1)`,
      [SITE_KEYS],
    )
  })

  console.log(`✅ 已迁移 ${rows.length} 条 site_* 设置并清理全局表`)
}
