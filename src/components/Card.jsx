import React, { memo, useCallback } from 'react'
import PropTypes from 'prop-types'

const Card = memo(function Card({ card, listId, onEdit, onDelete }) {
  const handleClick = useCallback(() => {
    if (onEdit) onEdit(card, listId)
  }, [card, listId, onEdit])

  const handleDelete = useCallback(
    (e) => {
      e.stopPropagation()
      if (onDelete) onDelete(card.id, listId)
    },
    [card.id, listId, onDelete]
  )

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-sm p-3 mb-2 cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-800 text-sm flex-1">
          {card.title}
        </h3>
        <button
          type="button"
          onClick={handleDelete}
          className="text-gray-400 hover:text-red-600 ml-2 text-xs"
          aria-label="Delete card"
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
}

Card.displayName = 'Card'

export default Card
