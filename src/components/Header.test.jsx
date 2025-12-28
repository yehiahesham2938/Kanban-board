import { render, screen, fireEvent } from '@testing-library/react'
import Header from './Header'

describe('Header', () => {
  const mockOnAddList = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render header title', () => {
    render(<Header onAddList={mockOnAddList} />)
    expect(screen.getByRole('heading', { name: /kanban board/i })).toBeInTheDocument()
  })

  it('should render add list button', () => {
    render(<Header onAddList={mockOnAddList} />)
    const addButton = screen.getByRole('button', { name: /add list/i })
    expect(addButton).toBeInTheDocument()
  })

  it('should call onAddList when add list button is clicked', () => {
    render(<Header onAddList={mockOnAddList} />)
    const addButton = screen.getByRole('button', { name: /add list/i })
    fireEvent.click(addButton)
    expect(mockOnAddList).toHaveBeenCalledWith('New List')
  })

  it('should not display offline status when online', () => {
    render(<Header onAddList={mockOnAddList} isOnline={true} />)
    expect(screen.queryByText(/offline/i)).not.toBeInTheDocument()
  })

  it('should display offline status', () => {
    render(<Header onAddList={mockOnAddList} isOnline={false} />)
    expect(screen.getByText(/offline/i)).toBeInTheDocument()
  })

  it('should display syncing status', () => {
    render(<Header onAddList={mockOnAddList} isOnline={true} isSyncing={true} />)
    expect(screen.getByText(/syncing/i)).toBeInTheDocument()
  })

  it('should display queue length', () => {
    render(<Header onAddList={mockOnAddList} isOnline={true} queueLength={5} />)
    expect(screen.getByText(/5.*pending/i)).toBeInTheDocument()
  })
})

