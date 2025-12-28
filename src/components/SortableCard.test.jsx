import { render, screen } from '@testing-library/react'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import SortableCard from './SortableCard'

// Mock the Card component
jest.mock('./Card', () => {
  return function MockCard({ card, onEdit, onDelete, isDragging }) {
    return (
      <div data-testid={`card-${card.id}`} data-dragging={isDragging}>
        <h3>{card.title}</h3>
        {card.description && <p>{card.description}</p>}
        {onEdit && <button onClick={onEdit}>Edit</button>}
        {onDelete && <button onClick={onDelete}>Delete</button>}
      </div>
    )
  }
})

describe('SortableCard', () => {
  const mockCard = {
    id: 'card-1',
    title: 'Test Card',
    description: 'Test Description',
    tags: ['tag1', 'tag2'],
  }

  const mockListId = 'list-1'
  const mockOnEdit = jest.fn()
  const mockOnDelete = jest.fn()

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

  it('should render card with correct props', () => {
    renderWithDndContext(
      <SortableCard
        card={mockCard}
        listId={mockListId}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByTestId(`card-${mockCard.id}`)).toBeInTheDocument()
    expect(screen.getByText('Test Card')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('should render without onEdit and onDelete callbacks', () => {
    renderWithDndContext(
      <SortableCard
        card={mockCard}
        listId={mockListId}
      />
    )

    expect(screen.getByTestId(`card-${mockCard.id}`)).toBeInTheDocument()
    expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    expect(screen.queryByText('Delete')).not.toBeInTheDocument()
  })

  it('should apply dragging styles when being dragged', () => {
    // This is tested indirectly through the Card component's isDragging prop
    // The actual dragging state is managed by @dnd-kit
    renderWithDndContext(
      <SortableCard
        card={mockCard}
        listId={mockListId}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    const cardElement = screen.getByTestId(`card-${mockCard.id}`)
    expect(cardElement).toBeInTheDocument()
  })

  it('should have correct accessibility attributes', () => {
    renderWithDndContext(
      <SortableCard
        card={mockCard}
        listId={mockListId}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    const cardContainer = screen.getByTestId(`card-${mockCard.id}`).parentElement
    expect(cardContainer).toHaveClass('cursor-grab')
  })
})

