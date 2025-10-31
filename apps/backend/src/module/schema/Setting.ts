import { Entity, PrimaryColumn, Column } from 'typeorm'
import { CTable } from '@u-blog/model'

/**
 * 设置表
 */
@Entity({ name: CTable.SETTING, comment: '设置表' })
export class Setting {
	@PrimaryColumn({ type: 'varchar', length: 100, comment: '键' })
	key!: string

	@Column({ type: 'text', nullable: true, comment: '值' })
	value?: string | null

	@Column({ type: 'varchar', length: 255, nullable: true, comment: '描述' })
	desc?: string | null
}
