import { render, screen } from '@testing-library/react'
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
})

