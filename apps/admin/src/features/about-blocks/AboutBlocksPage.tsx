import { useState } from 'react'
import { useTableScrollY } from '../../shared/hooks/useTableScrollY'
import { useAboutBlocks } from './useAboutBlocks'
import { useAboutBlockMutations } from './useAboutBlockMutations'
import { AboutBlockTable } from './AboutBlockTable'
import { AboutBlockFormModal } from './AboutBlockFormModal'
import type { AboutBlockItem } from './api'

export default function AboutBlocksPage() {
  const { data: list = [], isLoading } = useAboutBlocks()
  const { create, update, remove } = useAboutBlockMutations()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AboutBlockItem | null>(null)

  const handleAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const handleEdit = (record: AboutBlockItem) => {
    setEditing(record)
    setModalOpen(true)
  }

  const handleSubmit = async (values: {
    page: string
    sortOrder: number
    type: string
    title?: string
    content: string
    extra?: Record<string, unknown>
  }) => {
    if (editing) {
      await update.mutateAsync({ id: editing.id, ...values })
    } else {
      await create.mutateAsync(values)
    }
  }

  const { containerRef, scrollY } = useTableScrollY({ hasPagination: false })

  return (
    <div className="admin-content">
      <h1>关于页区块</h1>
      <div className="admin-content__table-wrap">
        <div ref={containerRef} className="admin-content__table-body">
          <AboutBlockTable
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
      <AboutBlockFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        loading={create.isPending || update.isPending}
        initial={editing}
      />
    </div>
  )
}
