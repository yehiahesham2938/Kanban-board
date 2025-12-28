import React from 'react'
import PropTypes from 'prop-types'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Card from './Card'

function SortableCard({ card, listId, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  }

  // Filter listeners to prevent drag on button clicks
  const handlePointerDown = React.useCallback(
    (e) => {
      const target = e.target
      
      // Only block if clicking directly on a button element (not role="button" on other elements)
      if (target.tagName === 'BUTTON') {
        e.stopPropagation()
        return
      }
      
      // Check if we're inside a button element (the delete button)
      const buttonElement = target.closest('button')
      if (buttonElement) {
        e.stopPropagation()
        return
      }
      
      // Allow drag for everything else - call the original listener
      if (listeners?.onPointerDown) {
        listeners.onPointerDown(e)
      }
    },
    [listeners]
  )

  // Combine listeners with our custom handler
  const combinedListeners = React.useMemo(() => {
    if (!listeners) return {}
    return {
      ...listeners,
      onPointerDown: handlePointerDown,
    }
  }, [listeners, handlePointerDown])

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...combinedListeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <Card
        card={card}
        listId={listId}
        onEdit={onEdit}
        onDelete={onDelete}
        isDragging={isDragging}
      />
    </div>
  )
}

SortableCard.propTypes = {
  card: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  listId: PropTypes.string.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
}

export default SortableCard


