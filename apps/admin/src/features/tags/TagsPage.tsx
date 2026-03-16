import { useMemo, useState } from 'react'
import { useTableScrollY } from '../../shared/hooks/useTableScrollY'
import { useTags } from './useTags'
import { useTagMutations } from './useTagMutations'
import { TagTable } from './TagTable'
import { TagFormModal } from './TagFormModal'
import type { TagItem } from './api'

export default function TagsPage() {
  const { data: list = [], isLoading } = useTags()
  const { create, update, remove } = useTagMutations()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TagItem | null>(null)

  const handleAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const handleEdit = (record: TagItem) => {
    setEditing(record)
    setModalOpen(true)
  }

  // 收集已有 tag 的颜色（编辑时排除当前项），用于去重
  const existingColors = useMemo(
    () => list.filter((t) => t.color && t.id !== editing?.id).map((t) => t.color!),
    [list, editing],
  )

  const handleSubmit = async (values: { name: string; desc?: string; color?: string }) => {
    if (editing) {
      await update.mutateAsync({ id: editing.id, ...values })
    } else {
      await create.mutateAsync(values)
    }
  }

  const { containerRef, scrollY } = useTableScrollY({ hasPagination: false })

  return (
    <div className="admin-content">
      <h1>标签管理</h1>
      <div className="admin-content__table-wrap">
        <div ref={containerRef} className="admin-content__table-body">
          <TagTable
            dataSource={list}
            loading={isLoading}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={(id) => remove.mutate(id)}
            deleteLoading={remove.isPending}
            scrollY={scrollY}
          />
        </div>
      </div>
      <TagFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        loading={create.isPending || update.isPending}
        initial={editing}
        existingColors={existingColors}
      />
    </div>
  )
}
