import React, { memo, useMemo } from 'react'
import PropTypes from 'prop-types'
import SortableCard from './SortableCard'

/**
 * Optimized card list using CSS content-visibility for performance
 * Renders all cards but browser skips rendering off-screen content
 * This maintains drag-and-drop compatibility while providing virtualization benefits
 */
const VirtualizedCardList = memo(function VirtualizedCardList({
  cards,
  listId,
  onEditCard,
  onDeleteCard,
  containerHeight = 600,
}) {
  // Memoize card elements to prevent unnecessary re-renders
  const cardElements = useMemo(() => {
    return cards.map((card) => (
      <div
        key={card.id}
        style={{
          contentVisibility: 'auto',
          containIntrinsicSize: '100px',
        }}
      >
        <SortableCard
          card={card}
          listId={listId}
          onEdit={onEditCard}
          onDelete={onDeleteCard}
        />
      </div>
    ))
  }, [cards, listId, onEditCard, onDeleteCard])

  return (
    <div
      className="space-y-2 mb-3 overflow-y-auto"
      style={{ 
        height: containerHeight, 
        maxHeight: '600px',
        // Enable CSS containment for better performance
        contain: 'layout style paint',
      }}
    >
      {cardElements}
    </div>
  )
})

VirtualizedCardList.propTypes = {
  cards: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      tags: PropTypes.arrayOf(PropTypes.string),
    })
  ).isRequired,
  listId: PropTypes.string.isRequired,
  onEditCard: PropTypes.func.isRequired,
  onDeleteCard: PropTypes.func.isRequired,
  itemHeight: PropTypes.number,
  containerHeight: PropTypes.number,
}

export default VirtualizedCardList

