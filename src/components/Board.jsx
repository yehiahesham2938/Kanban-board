import React, { useState, useCallback, useMemo, memo, Suspense, lazy } from 'react'
import {
  DndContext,
  closestCenter,
  closestCorners,
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
import Card from './Card'

// Lazy load heavy components
const CardDetailModal = lazy(() => import('./CardDetailModal'))

const Board = memo(function Board() {
  const { state, addList, renameList, archiveList, addCard, updateCard, deleteCard, moveCard, reorderCard } = useBoardContext()
  const [editingCard, setEditingCard] = useState(null)
  const [activeCardId, setActiveCardId] = useState(null)
  const [activeListId, setActiveListId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    }),
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
    const cardId = active.id.toString()
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

      if (!over) {
        setActiveCardId(null)
        setActiveListId(null)
        return
      }

      const cardId = active.id.toString()
      const sourceList = activeLists.find((list) =>
        list.cards.some((c) => c.id === cardId)
      )

      if (!sourceList) {
        setActiveCardId(null)
        setActiveListId(null)
        return
      }

      const sourceListId = sourceList.id

      // Check if dropped on a list (droppable area)
      const destinationList = activeLists.find((list) => list.id === over.id)
      if (destinationList) {
        // Dropped on a list - append to end
        if (destinationList.id !== sourceListId) {
          moveCard(cardId, sourceListId, destinationList.id, destinationList.cards.length)
        }
        setActiveCardId(null)
        setActiveListId(null)
        return
      }

      // Check if dropped on another card
      const destinationCardId = over.id.toString()
      const cardDestinationList = activeLists.find((list) =>
        list.cards.some((c) => c.id === destinationCardId)
      )

      if (cardDestinationList) {
        const destinationIndex = cardDestinationList.cards.findIndex(
          (c) => c.id === destinationCardId
        )

        if (cardDestinationList.id === sourceListId) {
          // Reordering within same list
          const sourceIndex = sourceList.cards.findIndex((c) => c.id === cardId)
          if (
            sourceIndex !== -1 &&
            destinationIndex !== -1 &&
            sourceIndex !== destinationIndex
          ) {
            reorderCard(sourceListId, cardId, destinationIndex)
          }
        } else {
          // Moving to different list
          moveCard(cardId, sourceListId, cardDestinationList.id, destinationIndex)
        }
      }

      setActiveCardId(null)
      setActiveListId(null)
    },
    [activeLists, moveCard, reorderCard]
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
        collisionDetection={closestCorners}
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
              <ListColumn
                key={list.id}
                list={list}
                onAddCard={addCard}
                onEditCard={handleEditCard}
                onDeleteCard={deleteCard}
                onRenameList={renameList}
                onArchiveList={archiveList}
              />
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
        <Suspense
          fallback={
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-700">Loading card editor...</span>
                </div>
              </div>
            </div>
          }
        >
          <CardDetailModal
            isOpen={true}
            card={editingCard.card}
            listId={editingCard.listId}
            onSave={handleSaveCard}
            onClose={() => setEditingCard(null)}
            onDelete={handleDeleteCard}
          />
        </Suspense>
      )}
    </div>
  )
})

export default Board
