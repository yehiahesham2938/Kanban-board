import React, { useState, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import SortableCard from './SortableCard'
import InlineEditor from './InlineEditor'
import ConfirmDialog from './ConfirmDialog'

function ListColumn({
  list,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onRenameList,
  onArchiveList,
}) {
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)

  const { setNodeRef } = useDroppable({
    id: list.id,
  })

  const handleAddCard = useCallback(
    (title) => {
      if (title.trim()) {
        onAddCard(list.id, { title: title.trim() })
      }
      setIsAddingCard(false)
    },
    [list.id, onAddCard]
  )

  const handleRenameList = useCallback(
    (newTitle) => {
      if (newTitle.trim() && newTitle !== list.title) {
        onRenameList(list.id, newTitle)
      }
      setIsRenaming(false)
    },
    [list.id, list.title, onRenameList]
  )

  const handleArchive = useCallback(() => {
    onArchiveList(list.id)
    setShowArchiveDialog(false)
  }, [list.id, onArchiveList])

  const activeCards = useMemo(
    () => list.cards.filter((card) => !card.archived),
    [list.cards]
  )

  if (list.archived) return null

  return (
    <div
      ref={setNodeRef}
      className="bg-gray-100 rounded-lg p-4 w-80 flex-shrink-0 min-h-[200px]"
    >
      <div className="flex justify-between items-center mb-3">
        {isRenaming ? (
          <div className="flex-1">
            <InlineEditor
              value={String(list.title || '')}
              onSave={handleRenameList}
              onCancel={() => setIsRenaming(false)}
              placeholder="List title"
            />
          </div>
        ) : (
          <>
            <h2
              className="font-semibold text-gray-800 cursor-pointer flex-1"
              onClick={() => setIsRenaming(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setIsRenaming(true)
                }
              }}
              role="button"
              tabIndex={0}
            >
              {String(list.title || 'Untitled List')}
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowArchiveDialog(true)}
                className="text-gray-400 hover:text-gray-600 text-sm"
                aria-label="Archive list"
              >
                Archive
              </button>
            </div>
          </>
        )}
      </div>

      <SortableContext
        items={activeCards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 mb-3 max-h-[calc(100vh-300px)] overflow-y-auto">
          {activeCards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              listId={list.id}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
            />
          ))}
        </div>
      </SortableContext>

      {isAddingCard ? (
        <InlineEditor
          value=""
          onSave={handleAddCard}
          onCancel={() => setIsAddingCard(false)}
          placeholder="Enter card title..."
        />
      ) : (
        <button
          type="button"
          onClick={() => setIsAddingCard(true)}
          className="w-full text-left px-3 py-2 text-gray-600 hover:bg-gray-200 rounded transition-colors"
        >
          + Add a card
        </button>
      )}

      <ConfirmDialog
        isOpen={showArchiveDialog}
        title="Archive List"
        message={`Are you sure you want to archive "${list.title}"? This will hide the list from the board.`}
        onConfirm={handleArchive}
        onCancel={() => setShowArchiveDialog(false)}
      />
    </div>
  )
}

ListColumn.propTypes = {
  list: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    cards: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
      })
    ),
    archived: PropTypes.bool,
  }).isRequired,
  onAddCard: PropTypes.func.isRequired,
  onEditCard: PropTypes.func.isRequired,
  onDeleteCard: PropTypes.func.isRequired,
  onRenameList: PropTypes.func.isRequired,
  onArchiveList: PropTypes.func.isRequired,
}

export default ListColumn
