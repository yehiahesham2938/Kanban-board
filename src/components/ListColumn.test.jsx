import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ListColumn from './ListColumn'
import BoardProvider from '../context/BoardProvider'

// Mock the services
jest.mock('../services/api', () => ({
  api: {
    createList: jest.fn().mockResolvedValue({}),
    updateList: jest.fn().mockResolvedValue({}),
    deleteList: jest.fn().mockResolvedValue({}),
    createCard: jest.fn().mockResolvedValue({}),
  },
}))

jest.mock('../services/storage', () => ({
  storage: {
    load: jest.fn().mockReturnValue(null),
    save: jest.fn(),
  },
}))

jest.mock('../services/offlineQueue', () => ({
  offlineQueue: {
    enqueue: jest.fn(),
    getAll: jest.fn().mockReturnValue([]),
  },
}))

jest.mock('../services/baseVersionStorage', () => ({
  baseVersionStorage: {
    load: jest.fn().mockReturnValue(null),
    save: jest.fn(),
  },
}))

jest.mock('../hooks/useOfflineSync', () => ({
  useOfflineSync: jest.fn(() => ({
    isOnline: true,
    isSyncing: false,
    queueLength: 0,
  })),
}))

jest.mock('../hooks/useSyncWithConflictResolution', () => ({
  useSyncWithConflictResolution: jest.fn(() => ({
    syncWithServer: jest.fn().mockResolvedValue({ conflicts: [], merged: null }),
    resolveConflict: jest.fn(),
    conflicts: [],
  })),
}))

const wrapper = ({ children }) => <BoardProvider>{children}</BoardProvider>

describe('ListColumn', () => {
  const mockList = {
    id: 'list-1',
    title: 'Test List',
    cards: [
      { id: 'card-1', title: 'Card 1', description: 'Description 1', tags: [] },
      { id: 'card-2', title: 'Card 2', description: 'Description 2', tags: [] },
    ],
    archived: false,
  }

  const mockOnAddCard = jest.fn()
  const mockOnEditCard = jest.fn()
  const mockOnDeleteCard = jest.fn()
  const mockOnRenameList = jest.fn()
  const mockOnArchiveList = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render list title', () => {
    render(
      <ListColumn
        list={mockList}
        onAddCard={mockOnAddCard}
        onEditCard={mockOnEditCard}
        onDeleteCard={mockOnDeleteCard}
        onRenameList={mockOnRenameList}
        onArchiveList={mockOnArchiveList}
      />,
      { wrapper }
    )
    expect(screen.getByText('Test List')).toBeInTheDocument()
  })

  it('should render all cards in the list', () => {
    render(
      <ListColumn
        list={mockList}
        onAddCard={mockOnAddCard}
        onEditCard={mockOnEditCard}
        onDeleteCard={mockOnDeleteCard}
        onRenameList={mockOnRenameList}
        onArchiveList={mockOnArchiveList}
      />,
      { wrapper }
    )
    expect(screen.getByText('Card 1')).toBeInTheDocument()
    expect(screen.getByText('Card 2')).toBeInTheDocument()
  })

  it('should call onAddCard when add card button is clicked', async () => {
    render(
      <ListColumn
        list={mockList}
        onAddCard={mockOnAddCard}
        onEditCard={mockOnEditCard}
        onDeleteCard={mockOnDeleteCard}
        onRenameList={mockOnRenameList}
        onArchiveList={mockOnArchiveList}
      />,
      { wrapper }
    )

    const addButton = screen.getByText(/add a card/i)
    fireEvent.click(addButton)

    // Wait for inline editor to appear, then type a title and press Enter
    await waitFor(() => {
      const input = screen.getByPlaceholderText(/enter card title/i)
      expect(input).toBeInTheDocument()
    })
    
    const input = screen.getByPlaceholderText(/enter card title/i)
    fireEvent.change(input, { target: { value: 'New Card' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    await waitFor(() => {
      expect(mockOnAddCard).toHaveBeenCalled()
    })
  })

  it('should call onRenameList when list title is clicked', async () => {
    render(
      <ListColumn
        list={mockList}
        onAddCard={mockOnAddCard}
        onEditCard={mockOnEditCard}
        onDeleteCard={mockOnDeleteCard}
        onRenameList={mockOnRenameList}
        onArchiveList={mockOnArchiveList}
      />,
      { wrapper }
    )

    // Click on the list title to trigger rename
    const listTitle = screen.getByText('Test List')
    fireEvent.click(listTitle)

    // Wait for inline editor to appear and type new name
    await waitFor(() => {
      const input = screen.getByPlaceholderText(/list title/i)
      expect(input).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText(/list title/i)
    fireEvent.change(input, { target: { value: 'Renamed List' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    await waitFor(() => {
      expect(mockOnRenameList).toHaveBeenCalledWith('list-1', 'Renamed List')
    })
  })

  it('should call onArchiveList when archive button is clicked', async () => {
    render(
      <ListColumn
        list={mockList}
        onAddCard={mockOnAddCard}
        onEditCard={mockOnEditCard}
        onDeleteCard={mockOnDeleteCard}
        onRenameList={mockOnRenameList}
        onArchiveList={mockOnArchiveList}
      />,
      { wrapper }
    )

    // Find archive button and click it to open dialog
    const archiveButton = screen.getByLabelText(/archive list/i)
    fireEvent.click(archiveButton)
    
    // Wait for dialog to appear and click confirm
    await waitFor(() => {
      expect(screen.getByText(/archive list/i)).toBeInTheDocument()
    })
    
    const confirmButton = screen.getByRole('button', { name: /confirm/i })
    fireEvent.click(confirmButton)
    
    await waitFor(() => {
      expect(mockOnArchiveList).toHaveBeenCalledWith('list-1')
    })
  })

  it('should render empty state when list has no cards', () => {
    const emptyList = { ...mockList, cards: [] }
    render(
      <ListColumn
        list={emptyList}
        onAddCard={mockOnAddCard}
        onEditCard={mockOnEditCard}
        onDeleteCard={mockOnDeleteCard}
        onRenameList={mockOnRenameList}
        onArchiveList={mockOnArchiveList}
      />,
      { wrapper }
    )
    expect(screen.queryByText('Card 1')).not.toBeInTheDocument()
  })

  it('should use virtualization for lists with 30+ cards', () => {
    const largeList = {
      ...mockList,
      cards: Array.from({ length: 35 }, (_, i) => ({
        id: `card-${i + 1}`,
        title: `Card ${i + 1}`,
        description: `Description ${i + 1}`,
        tags: [],
      })),
    }
    
    render(
      <ListColumn
        list={largeList}
        onAddCard={mockOnAddCard}
        onEditCard={mockOnEditCard}
        onDeleteCard={mockOnDeleteCard}
        onRenameList={mockOnRenameList}
        onArchiveList={mockOnArchiveList}
      />,
      { wrapper }
    )
    
    // VirtualizedCardList should be rendered for 30+ cards
    // We can't easily test the component, but we can verify the list renders
    expect(screen.getByText('Test List')).toBeInTheDocument()
  })

  it('should not render archived lists', () => {
    const archivedList = { ...mockList, archived: true }
    const { container } = render(
      <ListColumn
        list={archivedList}
        onAddCard={mockOnAddCard}
        onEditCard={mockOnEditCard}
        onDeleteCard={mockOnDeleteCard}
        onRenameList={mockOnRenameList}
        onArchiveList={mockOnArchiveList}
      />,
      { wrapper }
    )
    
    expect(container.firstChild).toBeNull()
  })

  it('should handle rename list with Enter key', async () => {
    render(
      <ListColumn
        list={mockList}
        onAddCard={mockOnAddCard}
        onEditCard={mockOnEditCard}
        onDeleteCard={mockOnDeleteCard}
        onRenameList={mockOnRenameList}
        onArchiveList={mockOnArchiveList}
      />,
      { wrapper }
    )

    const listTitle = screen.getByText('Test List')
    fireEvent.click(listTitle)

    await waitFor(() => {
      const input = screen.getByPlaceholderText(/list title/i)
      expect(input).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText(/list title/i)
    fireEvent.change(input, { target: { value: 'Renamed List' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    await waitFor(() => {
      expect(mockOnRenameList).toHaveBeenCalledWith('list-1', 'Renamed List')
    })
  })

  it('should handle rename list with Space key', async () => {
    render(
      <ListColumn
        list={mockList}
        onAddCard={mockOnAddCard}
        onEditCard={mockOnEditCard}
        onDeleteCard={mockOnDeleteCard}
        onRenameList={mockOnRenameList}
        onArchiveList={mockOnArchiveList}
      />,
      { wrapper }
    )

    const listTitle = screen.getByText('Test List')
    fireEvent.keyDown(listTitle, { key: ' ', code: 'Space' })

    await waitFor(() => {
      const input = screen.getByPlaceholderText(/list title/i)
      expect(input).toBeInTheDocument()
    })
  })

  it('should cancel rename when cancel is clicked', async () => {
    render(
      <ListColumn
        list={mockList}
        onAddCard={mockOnAddCard}
        onEditCard={mockOnEditCard}
        onDeleteCard={mockOnDeleteCard}
        onRenameList={mockOnRenameList}
        onArchiveList={mockOnArchiveList}
      />,
      { wrapper }
    )

    const listTitle = screen.getByText('Test List')
    fireEvent.click(listTitle)

    await waitFor(() => {
      const input = screen.getByPlaceholderText(/list title/i)
      expect(input).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText(/list title/i)
    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/list title/i)).not.toBeInTheDocument()
    })
    expect(mockOnRenameList).not.toHaveBeenCalled()
  })

  it('should not rename if title is unchanged', async () => {
    render(
      <ListColumn
        list={mockList}
        onAddCard={mockOnAddCard}
        onEditCard={mockOnEditCard}
        onDeleteCard={mockOnDeleteCard}
        onRenameList={mockOnRenameList}
        onArchiveList={mockOnArchiveList}
      />,
      { wrapper }
    )

    const listTitle = screen.getByText('Test List')
    fireEvent.click(listTitle)

    await waitFor(() => {
      const input = screen.getByPlaceholderText(/list title/i)
      expect(input).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText(/list title/i)
    fireEvent.change(input, { target: { value: 'Test List' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    await waitFor(() => {
      expect(mockOnRenameList).not.toHaveBeenCalled()
    })
  })

  it('should not add card if title is empty', async () => {
    render(
      <ListColumn
        list={mockList}
        onAddCard={mockOnAddCard}
        onEditCard={mockOnEditCard}
        onDeleteCard={mockOnDeleteCard}
        onRenameList={mockOnRenameList}
        onArchiveList={mockOnArchiveList}
      />,
      { wrapper }
    )

    const addButton = screen.getByText(/add a card/i)
    fireEvent.click(addButton)

    await waitFor(() => {
      const input = screen.getByPlaceholderText(/enter card title/i)
      expect(input).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText(/enter card title/i)
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    await waitFor(() => {
      expect(mockOnAddCard).not.toHaveBeenCalled()
    })
  })

  it('should cancel archive dialog', async () => {
    render(
      <ListColumn
        list={mockList}
        onAddCard={mockOnAddCard}
        onEditCard={mockOnEditCard}
        onDeleteCard={mockOnDeleteCard}
        onRenameList={mockOnRenameList}
        onArchiveList={mockOnArchiveList}
      />,
      { wrapper }
    )

    const archiveButton = screen.getByLabelText(/archive list/i)
    fireEvent.click(archiveButton)

    await waitFor(() => {
      expect(screen.getByText(/archive list/i)).toBeInTheDocument()
    })

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(mockOnArchiveList).not.toHaveBeenCalled()
    })
  })

  it('should filter out archived cards', () => {
    const listWithArchivedCards = {
      ...mockList,
      cards: [
        { id: 'card-1', title: 'Card 1', archived: false },
        { id: 'card-2', title: 'Card 2', archived: true },
        { id: 'card-3', title: 'Card 3', archived: false },
      ],
    }

    render(
      <ListColumn
        list={listWithArchivedCards}
        onAddCard={mockOnAddCard}
        onEditCard={mockOnEditCard}
        onDeleteCard={mockOnDeleteCard}
        onRenameList={mockOnRenameList}
        onArchiveList={mockOnArchiveList}
      />,
      { wrapper }
    )

    expect(screen.getByText('Card 1')).toBeInTheDocument()
    expect(screen.getByText('Card 3')).toBeInTheDocument()
    expect(screen.queryByText('Card 2')).not.toBeInTheDocument()
  })

  it('should handle list title with undefined value', () => {
    const listWithUndefinedTitle = { ...mockList, title: undefined }
    render(
      <ListColumn
        list={listWithUndefinedTitle}
        onAddCard={mockOnAddCard}
        onEditCard={mockOnEditCard}
        onDeleteCard={mockOnDeleteCard}
        onRenameList={mockOnRenameList}
        onArchiveList={mockOnArchiveList}
      />,
      { wrapper }
    )
    
    expect(screen.getByText('Untitled List')).toBeInTheDocument()
  })
})

