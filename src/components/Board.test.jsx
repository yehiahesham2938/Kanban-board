import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Board from './Board'
import BoardProvider from '../context/BoardProvider'

// Mock all services and hooks
jest.mock('../services/api', () => ({
  api: {
    createList: jest.fn().mockResolvedValue({}),
    updateList: jest.fn().mockResolvedValue({}),
    deleteList: jest.fn().mockResolvedValue({}),
    createCard: jest.fn().mockResolvedValue({}),
    updateCard: jest.fn().mockResolvedValue({}),
    deleteCard: jest.fn().mockResolvedValue({}),
    moveCard: jest.fn().mockResolvedValue({}),
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

describe('Board', () => {
  beforeEach(() => {
    const { storage } = require('../services/storage')
    storage.load.mockReturnValue(null)
  })

  it('should render empty state when no lists exist', () => {
    render(
      <BoardProvider>
        <Board />
      </BoardProvider>
    )
    expect(
      screen.getByText(/your board is empty/i)
    ).toBeInTheDocument()
  })

  it('should render lists when they exist', async () => {
    // Mock storage to return lists
    const { storage } = require('../services/storage')
    storage.load.mockReturnValue({
      lists: [
        {
          id: 'list-1',
          title: 'Test List',
          cards: [],
          archived: false,
        },
      ],
    })

    render(
      <BoardProvider>
        <Board />
      </BoardProvider>
    )

    // Wait for list to render
    await screen.findByText('Test List', {}, { timeout: 3000 })
    expect(screen.getByText('Test List')).toBeInTheDocument()
  })

  it('should render lists with cards', async () => {
    const { storage } = require('../services/storage')
    storage.load.mockReturnValue({
      lists: [
        {
          id: 'list-1',
          title: 'Test List',
          cards: [
            { id: 'card-1', title: 'Card 1', description: 'Description 1' },
          ],
          archived: false,
        },
      ],
    })

    render(
      <BoardProvider>
        <Board />
      </BoardProvider>
    )

    await screen.findByText('Test List', {}, { timeout: 3000 })
    expect(screen.getByText('Card 1')).toBeInTheDocument()
  })

  it('should not render archived lists', async () => {
    const { storage } = require('../services/storage')
    storage.load.mockReturnValue({
      lists: [
        {
          id: 'list-1',
          title: 'Active List',
          cards: [],
          archived: false,
        },
        {
          id: 'list-2',
          title: 'Archived List',
          cards: [],
          archived: true,
        },
      ],
    })

    render(
      <BoardProvider>
        <Board />
      </BoardProvider>
    )

    await screen.findByText('Active List', {}, { timeout: 3000 })
    expect(screen.getByText('Active List')).toBeInTheDocument()
    expect(screen.queryByText('Archived List')).not.toBeInTheDocument()
  })

  it('should handle card edit when card is clicked', async () => {
    const { storage } = require('../services/storage')
    storage.load.mockReturnValue({
      lists: [
        {
          id: 'list-1',
          title: 'Test List',
          cards: [
            { id: 'card-1', title: 'Card 1', description: 'Description 1' },
          ],
          archived: false,
        },
      ],
    })

    render(
      <BoardProvider>
        <Board />
      </BoardProvider>
    )

    await screen.findByText('Card 1', {}, { timeout: 3000 })
    
    // Click on the card to edit
    const card = screen.getByText('Card 1')
    fireEvent.click(card)

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText(/edit card/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should handle card save in modal', async () => {
    const { storage } = require('../services/storage')
    storage.load.mockReturnValue({
      lists: [
        {
          id: 'list-1',
          title: 'Test List',
          cards: [
            { id: 'card-1', title: 'Card 1', description: 'Description 1' },
          ],
          archived: false,
        },
      ],
    })

    render(
      <BoardProvider>
        <Board />
      </BoardProvider>
    )

    await screen.findByText('Card 1', {}, { timeout: 3000 })
    
    const card = screen.getByText('Card 1')
    fireEvent.click(card)

    await waitFor(() => {
      expect(screen.getByText(/edit card/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // Find and update the title input
    const titleInput = screen.getByRole('textbox', { name: /card title/i })
    await userEvent.clear(titleInput)
    await userEvent.type(titleInput, 'Updated Card')

    // Find and click save button
    const saveButton = screen.getByRole('button', { name: /^save$/i })
    fireEvent.click(saveButton)

    // Wait for modal to close
    await waitFor(() => {
      expect(screen.queryByText(/edit card/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should handle card delete in modal', async () => {
    const { storage } = require('../services/storage')
    storage.load.mockReturnValue({
      lists: [
        {
          id: 'list-1',
          title: 'Test List',
          cards: [
            { id: 'card-1', title: 'Card 1', description: 'Description 1' },
          ],
          archived: false,
        },
      ],
    })

    render(
      <BoardProvider>
        <Board />
      </BoardProvider>
    )

    await screen.findByText('Card 1', {}, { timeout: 3000 })
    
    const card = screen.getByText('Card 1')
    fireEvent.click(card)

    await waitFor(() => {
      expect(screen.getByText(/edit card/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // Find and click delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(deleteButton)

    // Wait for modal to close
    await waitFor(() => {
      expect(screen.queryByText(/edit card/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should handle card modal close', async () => {
    const { storage } = require('../services/storage')
    storage.load.mockReturnValue({
      lists: [
        {
          id: 'list-1',
          title: 'Test List',
          cards: [
            { id: 'card-1', title: 'Card 1', description: 'Description 1' },
          ],
          archived: false,
        },
      ],
    })

    render(
      <BoardProvider>
        <Board />
      </BoardProvider>
    )

    await screen.findByText('Card 1', {}, { timeout: 3000 })
    
    const card = screen.getByText('Card 1')
    fireEvent.click(card)

    await waitFor(() => {
      expect(screen.getByText(/edit card/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // Find and click close button
    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)

    // Wait for modal to close
    await waitFor(() => {
      expect(screen.queryByText(/edit card/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should handle drag start', async () => {
    const { storage } = require('../services/storage')
    storage.load.mockReturnValue({
      lists: [
        {
          id: 'list-1',
          title: 'Test List',
          cards: [
            { id: 'card-1', title: 'Card 1', description: 'Description 1' },
          ],
          archived: false,
        },
      ],
    })

    render(
      <BoardProvider>
        <Board />
      </BoardProvider>
    )

    await screen.findByText('Card 1', {}, { timeout: 3000 })
    
    // Simulate drag start by finding the draggable element
    const card = screen.getByText('Card 1')
    const draggableElement = card.closest('[data-rbd-draggable-id]') || card.closest('div')
    
    // Create a drag start event
    const dragStartEvent = new Event('dragstart', { bubbles: true })
    fireEvent(draggableElement, dragStartEvent)
  })

  it('should handle drag end with no over target', async () => {
    const { storage } = require('../services/storage')
    storage.load.mockReturnValue({
      lists: [
        {
          id: 'list-1',
          title: 'Test List',
          cards: [
            { id: 'card-1', title: 'Card 1', description: 'Description 1' },
          ],
          archived: false,
        },
      ],
    })

    render(
      <BoardProvider>
        <Board />
      </BoardProvider>
    )

    await screen.findByText('Card 1', {}, { timeout: 3000 })
    
    // Simulate drag end with no over target
    const dragEndEvent = new Event('dragend', { bubbles: true })
    fireEvent(document, dragEndEvent)
  })

  it('should handle multiple lists with cards', async () => {
    const { storage } = require('../services/storage')
    storage.load.mockReturnValue({
      lists: [
        {
          id: 'list-1',
          title: 'List 1',
          cards: [
            { id: 'card-1', title: 'Card 1' },
          ],
          archived: false,
        },
        {
          id: 'list-2',
          title: 'List 2',
          cards: [
            { id: 'card-2', title: 'Card 2' },
          ],
          archived: false,
        },
      ],
    })

    render(
      <BoardProvider>
        <Board />
      </BoardProvider>
    )

    await screen.findByText('List 1', {}, { timeout: 3000 })
    expect(screen.getByText('List 1')).toBeInTheDocument()
    expect(screen.getByText('List 2')).toBeInTheDocument()
    expect(screen.getByText('Card 1')).toBeInTheDocument()
    expect(screen.getByText('Card 2')).toBeInTheDocument()
  })
})

