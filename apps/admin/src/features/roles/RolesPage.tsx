import { useState } from 'react'
import { useTableScrollY } from '../../shared/hooks/useTableScrollY'
import { useRoles } from './useRoles'
import { useRoleMutations } from './useRoleMutations'
import { RoleTable } from './RoleTable'
import { RoleFormModal } from './RoleFormModal'
import type { RoleItem } from './api'

export default function RolesPage() {
  const { data: list = [], isLoading } = useRoles()
  const { create, update, remove } = useRoleMutations()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<RoleItem | null>(null)

  const handleAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const handleEdit = (record: RoleItem) => {
    setEditing(record)
    setModalOpen(true)
  }

  const handleSubmit = async (values: { name: string; desc: string; permissions?: { id: number }[] }) => {
    if (editing) {
      await update.mutateAsync({ id: editing.id, ...values })
    } else {
      await create.mutateAsync(values)
    }
  }

  const { containerRef, scrollY } = useTableScrollY({ hasPagination: false })

  return (
    <div className="admin-content">
      <h1>角色管理</h1>
      <div className="admin-content__table-wrap">
        <div ref={containerRef} className="admin-content__table-body">
          <RoleTable
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
      <RoleFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        loading={create.isPending || update.isPending}
        initial={editing}
      />
    </div>
  )
}
