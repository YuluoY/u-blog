import { useState } from 'react'
import { useTableScrollY } from '../../shared/hooks/useTableScrollY'
import { useFriendLinks } from './useFriendLinks'
import { useFriendLinkMutations } from './useFriendLinkMutations'
import { FriendLinkTable } from './FriendLinkTable'
import { FriendLinkFormModal } from './FriendLinkFormModal'
import type { FriendLinkItem } from './api'

export default function FriendLinksPage() {
  const { data: list = [], isLoading } = useFriendLinks()
  const { create, update, remove, review } = useFriendLinkMutations()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<FriendLinkItem | null>(null)

  const handleAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const handleEdit = (record: FriendLinkItem) => {
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

  const handleReview = (id: number, status: 'approved' | 'rejected') => {
    review.mutate({ id, status })
  }

  const { containerRef, scrollY } = useTableScrollY({ hasPagination: false })

  return (
    <div className="admin-content">
      <h1>友链管理</h1>
      <div className="admin-content__table-wrap">
        <div ref={containerRef} className="admin-content__table-body">
          <FriendLinkTable
            dataSource={list}
            loading={isLoading}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={(id) => remove.mutate(id)}
            onReview={handleReview}
            deleteLoading={remove.isPending}
            reviewLoading={review.isPending}
            scrollY={scrollY}
          />
        </div>
      </div>
      <FriendLinkFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        loading={create.isPending || update.isPending}
        initial={editing}
      />
    </div>
  )
}
