import React, { memo, useCallback } from 'react'
import PropTypes from 'prop-types'

const Card = memo(function Card({ card, listId, onEdit, onDelete, isDragging }) {
  const wasDraggedRef = React.useRef(false)
  const clickTimeoutRef = React.useRef(null)

  // Track if drag occurred
  React.useEffect(() => {
    if (isDragging) {
      wasDraggedRef.current = true
      // Clear any pending click
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current)
        clickTimeoutRef.current = null
      }
    } else {
      // Reset after drag ends
      setTimeout(() => {
        wasDraggedRef.current = false
      }, 150)
    }
  }, [isDragging])

  const handleClick = useCallback(
    (e) => {
      // Don't open edit modal if we just dragged
      if (wasDraggedRef.current || isDragging) {
        wasDraggedRef.current = false
        return
      }
      
      // Small delay to check if drag will start
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current)
      }
      
      clickTimeoutRef.current = setTimeout(() => {
        // Only open if we didn't drag
        if (!wasDraggedRef.current && !isDragging && onEdit) {
          onEdit(card, listId)
        }
      }, 200)
    },
    [card, listId, onEdit, isDragging]
  )

  const handleDelete = useCallback(
    (e) => {
      e.stopPropagation()
      e.preventDefault()
      if (onDelete) onDelete(listId, card.id)
    },
    [card.id, listId, onDelete]
  )

  React.useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-sm p-3 mb-2 hover:shadow-md transition-shadow border border-gray-200 select-none cursor-pointer"
      style={{ pointerEvents: 'auto' }}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-800 text-sm flex-1">
          {card.title}
        </h3>
        <button
          type="button"
          onClick={handleDelete}
          onMouseDown={(e) => {
            e.stopPropagation()
            e.preventDefault()
          }}
          onPointerDown={(e) => {
            e.stopPropagation()
            e.preventDefault()
          }}
          className="text-gray-400 hover:text-red-600 ml-2 text-xs pointer-events-auto z-10 relative"
          aria-label="Delete card"
          style={{ pointerEvents: 'auto' }}
        >
          ×
        </button>
      </div>
      {card.description && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
          {card.description}
        </p>
      )}
      {card.tags && card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {card.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
})

Card.propTypes = {
  card: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  listId: PropTypes.string.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  isDragging: PropTypes.bool,
}

Card.displayName = 'Card'

export default Card
