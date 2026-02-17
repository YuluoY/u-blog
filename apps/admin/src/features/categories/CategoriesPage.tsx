import { useState } from 'react'
import { useTableScrollY } from '../../shared/hooks/useTableScrollY'
import { useCategories } from './useCategories'
import { useCategoryMutations } from './useCategoryMutations'
import { CategoryTable } from './CategoryTable'
import { CategoryFormModal } from './CategoryFormModal'
import type { CategoryItem } from './api'

export default function CategoriesPage() {
  const { data: list = [], isLoading } = useCategories()
  const { create, update, remove } = useCategoryMutations()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryItem | null>(null)

  const handleAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const handleEdit = (record: CategoryItem) => {
    setEditing(record)
    setModalOpen(true)
  }

  const handleSubmit = async (values: { name: string; desc?: string }) => {
    if (editing) {
      await update.mutateAsync({ id: editing.id, ...values })
    } else {
      await create.mutateAsync(values)
    }
  }

  const { containerRef, scrollY } = useTableScrollY({ hasPagination: false })

  return (
    <div className="admin-content">
      <h1>分类管理</h1>
      <div className="admin-content__table-wrap">
        <div ref={containerRef} className="admin-content__table-body">
          <CategoryTable
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
      <CategoryFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        loading={create.isPending || update.isPending}
        initial={editing}
      />
    </div>
  )
}
