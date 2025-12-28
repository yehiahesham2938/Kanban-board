import { render, screen } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'
import VirtualizedCardList from './VirtualizedCardList'

// Mock SortableCard
jest.mock('./SortableCard', () => {
  return function MockSortableCard({ card, onEdit, onDelete }) {
    return (
      <div data-testid={`sortable-card-${card.id}`}>
        <h3>{card.title}</h3>
        {card.description && <p>{card.description}</p>}
      </div>
    )
  }
})

describe('VirtualizedCardList', () => {
  const mockCards = [
    { id: 'card-1', title: 'Card 1', description: 'Description 1' },
    { id: 'card-2', title: 'Card 2', description: 'Description 2' },
    { id: 'card-3', title: 'Card 3' },
  ]

  const mockListId = 'list-1'
  const mockOnEditCard = jest.fn()
  const mockOnDeleteCard = jest.fn()

  const renderWithDndContext = (component) => {
    return render(
      <DndContext onDragEnd={() => {}}>
        {component}
      </DndContext>
    )
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render all cards', () => {
    renderWithDndContext(
      <VirtualizedCardList
        cards={mockCards}
        listId={mockListId}
        onEditCard={mockOnEditCard}
        onDeleteCard={mockOnDeleteCard}
      />
    )

    expect(screen.getByTestId('sortable-card-card-1')).toBeInTheDocument()
    expect(screen.getByTestId('sortable-card-card-2')).toBeInTheDocument()
    expect(screen.getByTestId('sortable-card-card-3')).toBeInTheDocument()
  })

  it('should render empty list when no cards', () => {
    renderWithDndContext(
      <VirtualizedCardList
        cards={[]}
        listId={mockListId}
        onEditCard={mockOnEditCard}
        onDeleteCard={mockOnDeleteCard}
      />
    )

    expect(screen.queryByTestId(/sortable-card-/)).not.toBeInTheDocument()
  })

  it('should use custom containerHeight', () => {
    const { container } = renderWithDndContext(
      <VirtualizedCardList
        cards={mockCards}
        listId={mockListId}
        onEditCard={mockOnEditCard}
        onDeleteCard={mockOnDeleteCard}
        containerHeight={800}
      />
    )

    const listContainer = container.querySelector('.space-y-2')
    expect(listContainer).toHaveStyle({ height: '800px' })
  })

  it('should use default containerHeight when not provided', () => {
    const { container } = renderWithDndContext(
      <VirtualizedCardList
        cards={mockCards}
        listId={mockListId}
        onEditCard={mockOnEditCard}
        onDeleteCard={mockOnDeleteCard}
      />
    )

    const listContainer = container.querySelector('.space-y-2')
    expect(listContainer).toHaveStyle({ height: '600px' })
  })

  it('should pass correct props to SortableCard', () => {
    renderWithDndContext(
      <VirtualizedCardList
        cards={mockCards}
        listId={mockListId}
        onEditCard={mockOnEditCard}
        onDeleteCard={mockOnDeleteCard}
      />
    )

    expect(screen.getByText('Card 1')).toBeInTheDocument()
    expect(screen.getByText('Card 2')).toBeInTheDocument()
    expect(screen.getByText('Card 3')).toBeInTheDocument()
  })

  it('should memoize card elements', () => {
    const { rerender } = renderWithDndContext(
      <VirtualizedCardList
        cards={mockCards}
        listId={mockListId}
        onEditCard={mockOnEditCard}
        onDeleteCard={mockOnDeleteCard}
      />
    )

    const initialCard = screen.getByTestId('sortable-card-card-1')

    // Rerender with same props
    rerender(
      <DndContext onDragEnd={() => {}}>
        <VirtualizedCardList
          cards={mockCards}
          listId={mockListId}
          onEditCard={mockOnEditCard}
          onDeleteCard={mockOnDeleteCard}
        />
      </DndContext>
    )

    // Card should still be in document (memoization prevents unnecessary re-renders)
    expect(screen.getByTestId('sortable-card-card-1')).toBeInTheDocument()
  })

  it('should update when cards change', () => {
    const { rerender } = renderWithDndContext(
      <VirtualizedCardList
        cards={mockCards}
        listId={mockListId}
        onEditCard={mockOnEditCard}
        onDeleteCard={mockOnDeleteCard}
      />
    )

    expect(screen.getByTestId('sortable-card-card-1')).toBeInTheDocument()

    const newCards = [{ id: 'card-4', title: 'Card 4' }]
    rerender(
      <DndContext onDragEnd={() => {}}>
        <VirtualizedCardList
          cards={newCards}
          listId={mockListId}
          onEditCard={mockOnEditCard}
          onDeleteCard={mockOnDeleteCard}
        />
      </DndContext>
    )

    expect(screen.queryByTestId('sortable-card-card-1')).not.toBeInTheDocument()
    expect(screen.getByTestId('sortable-card-card-4')).toBeInTheDocument()
  })
})

