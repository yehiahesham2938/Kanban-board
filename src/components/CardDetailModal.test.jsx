import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CardDetailModal from './CardDetailModal'

describe('CardDetailModal', () => {
  const mockCard = {
    id: 'card-1',
    title: 'Test Card',
    description: 'Test description',
    tags: ['frontend', 'urgent'],
  }

  const mockOnSave = jest.fn()
  const mockOnClose = jest.fn()
  const mockOnDelete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not render when isOpen is false', () => {
    render(
      <CardDetailModal
        isOpen={false}
        card={mockCard}
        listId="list-1"
        onSave={mockOnSave}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
      />
    )
    expect(screen.queryByText('Edit Card')).not.toBeInTheDocument()
  })

  it('should render modal when isOpen is true', () => {
    render(
      <CardDetailModal
        isOpen={true}
        card={mockCard}
        listId="list-1"
        onSave={mockOnSave}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
      />
    )
    expect(screen.getByText('Edit Card')).toBeInTheDocument()
  })

  it('should display card title', () => {
    render(
      <CardDetailModal
        isOpen={true}
        card={mockCard}
        listId="list-1"
        onSave={mockOnSave}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
      />
    )
    const titleInput = screen.getByPlaceholderText('Card title')
    expect(titleInput).toHaveValue('Test Card')
  })

  it('should display card description', () => {
    render(
      <CardDetailModal
        isOpen={true}
        card={mockCard}
        listId="list-1"
        onSave={mockOnSave}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
      />
    )
    const descriptionInput = screen.getByPlaceholderText('Card description')
    expect(descriptionInput).toHaveValue('Test description')
  })

  it('should display card tags', () => {
    render(
      <CardDetailModal
        isOpen={true}
        card={mockCard}
        listId="list-1"
        onSave={mockOnSave}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
      />
    )
    expect(screen.getByText('frontend')).toBeInTheDocument()
    expect(screen.getByText('urgent')).toBeInTheDocument()
  })

  it('should call onSave when save button is clicked', () => {
    render(
      <CardDetailModal
        isOpen={true}
        card={mockCard}
        listId="list-1"
        onSave={mockOnSave}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
      />
    )
    const saveButton = screen.getByRole('button', { name: /^Save$/i })
    fireEvent.click(saveButton)
    expect(mockOnSave).toHaveBeenCalledWith('list-1', 'card-1', {
      title: 'Test Card',
      description: 'Test description',
      tags: ['frontend', 'urgent'],
    })
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should call onClose when close button is clicked', () => {
    render(
      <CardDetailModal
        isOpen={true}
        card={mockCard}
        listId="list-1"
        onSave={mockOnSave}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
      />
    )
    const closeButton = screen.getByLabelText('Close')
    fireEvent.click(closeButton)
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should call onClose when clicking outside modal', () => {
    render(
      <CardDetailModal
        isOpen={true}
        card={mockCard}
        listId="list-1"
        onSave={mockOnSave}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
      />
    )
    const backdrop = screen.getByText('Edit Card').closest('div[class*="fixed"]')
    fireEvent.click(backdrop)
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should update title when typing', () => {
    render(
      <CardDetailModal
        isOpen={true}
        card={mockCard}
        listId="list-1"
        onSave={mockOnSave}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
      />
    )
    const titleInput = screen.getByPlaceholderText('Card title')
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } })
    expect(titleInput).toHaveValue('Updated Title')
  })

  it('should add a tag', () => {
    render(
      <CardDetailModal
        isOpen={true}
        card={mockCard}
        listId="list-1"
        onSave={mockOnSave}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
      />
    )
    const tagInput = screen.getByPlaceholderText('Add a tag')
    fireEvent.change(tagInput, { target: { value: 'newtag' } })
    fireEvent.keyDown(tagInput, { key: 'Enter' })
    expect(screen.getByText('newtag')).toBeInTheDocument()
  })

  it('should remove a tag', () => {
    render(
      <CardDetailModal
        isOpen={true}
        card={mockCard}
        listId="list-1"
        onSave={mockOnSave}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
      />
    )
    const removeButtons = screen.getAllByLabelText(/remove tag/i)
    fireEvent.click(removeButtons[0])
    expect(screen.queryByText('frontend')).not.toBeInTheDocument()
  })

  it('should call onDelete when delete button is clicked', () => {
    // Mock window.confirm to return true
    window.confirm = jest.fn(() => true)
    
    render(
      <CardDetailModal
        isOpen={true}
        card={mockCard}
        listId="list-1"
        onSave={mockOnSave}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
      />
    )
    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)
    expect(mockOnDelete).toHaveBeenCalledWith('list-1', 'card-1')
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should close modal on Escape key', () => {
    render(
      <CardDetailModal
        isOpen={true}
        card={mockCard}
        listId="list-1"
        onSave={mockOnSave}
        onClose={mockOnClose}
        onDelete={mockOnDelete}
      />
    )
    const modal = screen.getByText('Edit Card').closest('div[class*="fixed"]')
    fireEvent.keyDown(modal, { key: 'Escape' })
    expect(mockOnClose).toHaveBeenCalled()
  })
})

