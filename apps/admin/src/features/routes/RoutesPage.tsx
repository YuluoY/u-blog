import { useRef, useState } from 'react'
import { useTableScrollY } from '../../shared/hooks/useTableScrollY'
import { useRoutes } from './useRoutes'
import { useRouteMutations } from './useRouteMutations'
import { RouteTable } from './RouteTable'
import { RouteFormModal } from './RouteFormModal'
import type { RouteItem } from './api'

export default function RoutesPage() {
  const { data: list = [], isLoading } = useRoutes()
  const { create, update, remove } = useRouteMutations()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<RouteItem | null>(null)

  const handleAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const handleEdit = (record: RouteItem) => {
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

  const toolbarRef = useRef<HTMLDivElement>(null)
  const { containerRef, scrollY } = useTableScrollY({ hasPagination: false, toolbarRef })

  return (
    <div className="admin-content">
      <h1>路由管理</h1>
      <div className="admin-content__table-wrap">
        <div ref={containerRef} className="admin-content__table-body">
          <RouteTable
            dataSource={list}
            loading={isLoading}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={(id) => remove.mutate(id)}
            deleteLoading={remove.isPending}
            scrollY={scrollY}
            toolbarRef={toolbarRef}
          />
        </div>
      </div>
      <RouteFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        loading={create.isPending || update.isPending}
        initial={editing}
        allRoutes={list}
      />
    </div>
  )
}
