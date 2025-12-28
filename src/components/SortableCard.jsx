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
  }

  // Create listeners that don't interfere with button clicks
  const dragListeners = {
    ...listeners,
    onPointerDown: (e) => {
      // Don't start drag if clicking on a button or interactive element
      if (
        e.target.tagName === 'BUTTON' ||
        e.target.closest('button') ||
        e.target.closest('[role="button"]')
      ) {
        return
      }
      if (listeners.onPointerDown) {
        listeners.onPointerDown(e)
      }
    },
    onMouseDown: (e) => {
      // Don't start drag if clicking on a button or interactive element
      if (
        e.target.tagName === 'BUTTON' ||
        e.target.closest('button') ||
        e.target.closest('[role="button"]')
      ) {
        return
      }
      if (listeners.onMouseDown) {
        listeners.onMouseDown(e)
      }
    },
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...dragListeners}>
      <Card
        card={card}
        listId={listId}
        onEdit={onEdit}
        onDelete={onDelete}
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

