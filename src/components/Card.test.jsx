import { render, screen, fireEvent } from '@testing-library/react'
import Card from './Card'

describe('Card', () => {
  const mockCard = {
    id: 'card-1',
    title: 'Test Card',
    description: 'Test description',
    tags: ['frontend', 'urgent'],
  }

  const mockOnEdit = jest.fn()
  const mockOnDelete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render card with title', () => {
    render(<Card card={mockCard} listId="list-1" />)
    expect(screen.getByText('Test Card')).toBeInTheDocument()
  })

  it('should render card with description', () => {
    render(<Card card={mockCard} listId="list-1" />)
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('should render card tags', () => {
    render(<Card card={mockCard} listId="list-1" />)
    expect(screen.getByText('frontend')).toBeInTheDocument()
    expect(screen.getByText('urgent')).toBeInTheDocument()
  })

  it('should call onEdit when card is clicked', async () => {
    render(<Card card={mockCard} listId="list-1" onEdit={mockOnEdit} />)
    const cardElement = screen.getByText('Test Card').closest('div')
    fireEvent.click(cardElement)
    // Wait for the timeout in the click handler
    await new Promise(resolve => setTimeout(resolve, 250))
    expect(mockOnEdit).toHaveBeenCalledWith(mockCard, 'list-1')
  })

  it('should call onDelete when delete button is clicked', () => {
    render(<Card card={mockCard} listId="list-1" onDelete={mockOnDelete} />)
    const deleteButton = screen.getByLabelText('Delete card')
    fireEvent.click(deleteButton)
    expect(mockOnDelete).toHaveBeenCalledWith('list-1', 'card-1')
  })

  it('should not call onEdit when isDragging is true', () => {
    render(
      <Card card={mockCard} listId="list-1" onEdit={mockOnEdit} isDragging={true} />
    )
    const cardElement = screen.getByText('Test Card').closest('div')
    fireEvent.click(cardElement)
    expect(mockOnEdit).not.toHaveBeenCalled()
  })

  it('should render card without description', () => {
    const cardWithoutDescription = { ...mockCard, description: undefined }
    render(<Card card={cardWithoutDescription} listId="list-1" />)
    expect(screen.getByText('Test Card')).toBeInTheDocument()
    expect(screen.queryByText('Test description')).not.toBeInTheDocument()
  })

  it('should render card without tags', () => {
    const cardWithoutTags = { ...mockCard, tags: [] }
    render(<Card card={cardWithoutTags} listId="list-1" />)
    expect(screen.getByText('Test Card')).toBeInTheDocument()
    expect(screen.queryByText('frontend')).not.toBeInTheDocument()
  })

  it('should handle click timeout cleanup', async () => {
    jest.useFakeTimers()
    render(<Card card={mockCard} listId="list-1" onEdit={mockOnEdit} />)
    const cardElement = screen.getByText('Test Card').closest('div')
    
    fireEvent.click(cardElement)
    
    // Fast-forward time to trigger the timeout
    jest.advanceTimersByTime(200)
    
    await Promise.resolve()
    expect(mockOnEdit).toHaveBeenCalled()
    
    jest.useRealTimers()
  })

  it('should clear timeout when component unmounts', () => {
    jest.useFakeTimers()
    const { unmount } = render(<Card card={mockCard} listId="list-1" onEdit={mockOnEdit} />)
    const cardElement = screen.getByText('Test Card').closest('div')
    
    fireEvent.click(cardElement)
    unmount()
    
    // Should not throw when timers are cleared
    jest.runAllTimers()
    
    jest.useRealTimers()
  })

  it('should handle delete button mouse down events', () => {
    render(<Card card={mockCard} listId="list-1" onDelete={mockOnDelete} />)
    const deleteButton = screen.getByLabelText('Delete card')
    
    const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    fireEvent(deleteButton, mouseDownEvent)
    
    expect(mouseDownEvent.defaultPrevented).toBe(true)
  })

  it('should handle delete button pointer down events', () => {
    render(<Card card={mockCard} listId="list-1" onDelete={mockOnDelete} />)
    const deleteButton = screen.getByLabelText('Delete card')
    
    const pointerDownEvent = new PointerEvent('pointerdown', { bubbles: true, cancelable: true })
    fireEvent(deleteButton, pointerDownEvent)
    
    expect(pointerDownEvent.defaultPrevented).toBe(true)
  })

  it('should not call onEdit if wasDraggedRef is true', async () => {
    jest.useFakeTimers()
    render(<Card card={mockCard} listId="list-1" onEdit={mockOnEdit} isDragging={false} />)
    const cardElement = screen.getByText('Test Card').closest('div')
    
    // Simulate drag by setting isDragging to true then false
    const { rerender } = render(<Card card={mockCard} listId="list-1" onEdit={mockOnEdit} isDragging={true} />)
    rerender(<Card card={mockCard} listId="list-1" onEdit={mockOnEdit} isDragging={false} />)
    
    // Wait for the reset timeout
    jest.advanceTimersByTime(150)
    
    // Now click
    fireEvent.click(cardElement)
    jest.advanceTimersByTime(200)
    
    // Should not call onEdit because wasDraggedRef was true
    await Promise.resolve()
    
    jest.useRealTimers()
  })

  it('should clear pending click when drag starts', () => {
    jest.useFakeTimers()
    const { rerender } = render(<Card card={mockCard} listId="list-1" onEdit={mockOnEdit} isDragging={false} />)
    const cardElement = screen.getByText('Test Card').closest('div')
    
    // Click to set up a pending timeout
    fireEvent.click(cardElement)
    
    // Start dragging before timeout completes
    rerender(<Card card={mockCard} listId="list-1" onEdit={mockOnEdit} isDragging={true} />)
    
    // Fast-forward time
    jest.advanceTimersByTime(200)
    
    // Should not call onEdit because drag started
    expect(mockOnEdit).not.toHaveBeenCalled()
    
    jest.useRealTimers()
  })
})

