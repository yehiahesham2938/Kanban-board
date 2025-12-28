import React, { useState, useCallback, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useBoardContext } from '../context/BoardProvider'
import ListColumn from './ListColumn'
import CardDetailModal from './CardDetailModal'
import Card from './Card'

function Board() {
  const { state, addList, renameList, archiveList, addCard, updateCard, deleteCard, moveCard, reorderCard } = useBoardContext()
  const [editingCard, setEditingCard] = useState(null)
  const [activeCardId, setActiveCardId] = useState(null)
  const [activeListId, setActiveListId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const activeLists = useMemo(
    () => state.lists.filter((list) => !list.archived),
    [state.lists]
  )

  const handleAddList = useCallback(() => {
    addList('New List')
  }, [addList])

  const handleEditCard = useCallback((card, listId) => {
    setEditingCard({ card, listId })
  }, [])

  const handleSaveCard = useCallback(
    (listId, cardId, updates) => {
      updateCard(listId, cardId, updates)
      setEditingCard(null)
    },
    [updateCard]
  )

  const handleDeleteCard = useCallback(
    (listId, cardId) => {
      deleteCard(listId, cardId)
      setEditingCard(null)
    },
    [deleteCard]
  )

  const handleDragStart = useCallback((event) => {
    const { active } = event
    const cardId = active.id
    const list = activeLists.find((l) =>
      l.cards.some((c) => c.id === cardId)
    )
    if (list) {
      setActiveCardId(cardId)
      setActiveListId(list.id)
    }
  }, [activeLists])

  const activeCard = useMemo(() => {
    if (!activeCardId || !activeListId) return null
    const list = activeLists.find((l) => l.id === activeListId)
    return list?.cards.find((c) => c.id === activeCardId) || null
  }, [activeCardId, activeListId, activeLists])

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event

      if (!over || !activeCardId || !activeListId) {
        setActiveCardId(null)
        setActiveListId(null)
        return
      }

      const cardId = activeCardId
      const sourceListId = activeListId

      // Check if dropped on a list (droppable)
      if (over.id === sourceListId) {
        // Dropped on same list, might be reordering
        setActiveCardId(null)
        setActiveListId(null)
        return
      }

      const destinationList = activeLists.find((list) => list.id === over.id)
      if (destinationList && destinationList.id !== sourceListId) {
        // Moving to a different list
        const destinationIndex = destinationList.cards.length
        moveCard(cardId, sourceListId, destinationList.id, destinationIndex)
      } else {
        // Check if dropped on another card
        const destinationCardId = over.id
        const destinationList = activeLists.find((list) =>
          list.cards.some((c) => c.id === destinationCardId)
        )

        if (destinationList) {
          const destinationIndex = destinationList.cards.findIndex(
            (c) => c.id === destinationCardId
          )

          if (destinationList.id === sourceListId) {
            // Reordering within same list
            const sourceIndex = destinationList.cards.findIndex(
              (c) => c.id === cardId
            )
            if (sourceIndex !== -1 && destinationIndex !== -1 && sourceIndex !== destinationIndex) {
              reorderCard(sourceListId, cardId, destinationIndex)
            }
          } else {
            // Moving to different list
            moveCard(cardId, sourceListId, destinationList.id, destinationIndex)
          }
        }
      }

      setActiveCardId(null)
      setActiveListId(null)
    },
    [activeCardId, activeListId, activeLists, moveCard, reorderCard]
  )

  const handleDragOver = useCallback((event) => {
    const { over } = event
    if (over) {
      // Visual feedback can be added here
    }
  }, [])

  return (
    <div className="flex-1 overflow-x-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        {activeLists.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center">
              <p className="text-gray-500 text-lg mb-4">
                Your board is empty. Click "Add List" to get started!
              </p>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 p-4 min-h-full">
            {activeLists.map((list) => (
              <SortableContext
                key={list.id}
                id={list.id}
                items={list.cards.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <ListColumn
                  list={list}
                  onAddCard={addCard}
                  onEditCard={handleEditCard}
                  onDeleteCard={deleteCard}
                  onRenameList={renameList}
                  onArchiveList={archiveList}
                />
              </SortableContext>
            ))}
          </div>
        )}
        <DragOverlay>
          {activeCard ? (
            <div className="opacity-50">
              <Card card={activeCard} listId={activeListId} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {editingCard && (
        <CardDetailModal
          isOpen={true}
          card={editingCard.card}
          listId={editingCard.listId}
          onSave={handleSaveCard}
          onClose={() => setEditingCard(null)}
          onDelete={handleDeleteCard}
        />
      )}
    </div>
  )
}

export default Board
