import { useState } from 'react'
import { useTableScrollY } from '../../shared/hooks/useTableScrollY'
import { usePermissions } from './usePermissions'
import { usePermissionMutations } from './usePermissionMutations'
import { PermissionTable } from './PermissionTable'
import { PermissionFormModal } from './PermissionFormModal'
import type { PermissionItem } from './api'

export default function PermissionsPage() {
  const { data: list = [], isLoading } = usePermissions()
  const { create, update, remove } = usePermissionMutations()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PermissionItem | null>(null)

  const handleAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const handleEdit = (record: PermissionItem) => {
    setEditing(record)
    setModalOpen(true)
  }

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (editing) {
      await update.mutateAsync({ id: editing.id, ...values })
    } else {
      await create.mutateAsync(values)
    }
  }

  const { containerRef, scrollY } = useTableScrollY({ hasPagination: false })

  return (
    <div className="admin-content">
      <h1>权限管理</h1>
      <div className="admin-content__table-wrap">
        <div ref={containerRef} className="admin-content__table-body">
          <PermissionTable
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
      <PermissionFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        loading={create.isPending || update.isPending}
        initial={editing}
      />
    </div>
  )
}
