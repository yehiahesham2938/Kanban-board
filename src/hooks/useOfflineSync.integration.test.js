import { renderHook, act, waitFor } from '@testing-library/react'
import { useOfflineSync } from './useOfflineSync'
import { offlineQueue } from '../services/offlineQueue'
import { api } from '../services/api'

// Mock the services
jest.mock('../services/offlineQueue', () => ({
  offlineQueue: {
    getAll: jest.fn(() => []),
    dequeue: jest.fn(),
    incrementRetry: jest.fn(),
    enqueue: jest.fn(),
  },
}))

jest.mock('../services/api', () => ({
  api: {
    createList: jest.fn(),
    updateList: jest.fn(),
    deleteList: jest.fn(),
    createCard: jest.fn(),
    updateCard: jest.fn(),
    deleteCard: jest.fn(),
    moveCard: jest.fn(),
  },
}))

/**
 * Integration tests for offline syncing
 * Tests complete workflows including offline operations and reconnection
 */
describe('useOfflineSync Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    offlineQueue.getAll.mockReturnValue([])
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    })
  })

  it('should handle complete offline workflow: queue operations, go offline, reconnect, sync', async () => {
    const onSyncError = jest.fn()
    
    // Use a dynamic queue that updates when dequeue is called
    const operations = [
      {
        id: 'op-1',
        type: 'CREATE_LIST',
        data: { id: 'list-1', title: 'New List' },
        retries: 0,
      },
      {
        id: 'op-2',
        type: 'CREATE_CARD',
        data: { listId: 'list-1', card: { id: 'card-1', title: 'New Card' } },
        retries: 0,
      },
    ]
    
    let queue = [...operations]
    offlineQueue.getAll.mockImplementation(() => [...queue])
    offlineQueue.dequeue.mockImplementation((id) => {
      queue = queue.filter(op => op.id !== id)
      return true
    })
    api.createList.mockResolvedValue({ id: 'list-1', title: 'New List' })
    api.createCard.mockResolvedValue({ id: 'card-1', title: 'New Card' })

    const { result } = renderHook(() => useOfflineSync(onSyncError))

    // Wait for hook to initialize
    await waitFor(() => {
      expect(result.current.isOnline).toBe(true)
    })

    // Clear any API calls that might have happened during initialization
    jest.clearAllMocks()

    // 2. Go offline
    act(() => {
      navigator.onLine = false
      window.dispatchEvent(new Event('offline'))
    })

    await waitFor(() => {
      expect(result.current.isOnline).toBe(false)
    })

    // 3. Try to sync while offline (should not sync because isOnline is false)
    await act(async () => {
      await result.current.syncQueue()
    })

    // syncQueue should return early when offline, so API should not be called
    expect(api.createList).not.toHaveBeenCalled()

    // 4. Come back online
    act(() => {
      navigator.onLine = true
      window.dispatchEvent(new Event('online'))
    })

    await waitFor(() => {
      expect(result.current.isOnline).toBe(true)
    })

    // 5. Sync queued operations
    await act(async () => {
      await result.current.syncQueue()
    })

    await waitFor(() => {
      expect(api.createList).toHaveBeenCalledWith(operations[0].data)
      expect(api.createCard).toHaveBeenCalledWith(
        operations[1].data.listId,
        operations[1].data.card
      )
      expect(offlineQueue.dequeue).toHaveBeenCalledTimes(2)
    }, { timeout: 5000 })
  }, 10000)

  it('should handle retry logic for failed operations', async () => {
    const onSyncError = jest.fn()
    const { result } = renderHook(() => useOfflineSync(onSyncError, { maxRetries: 3 }))

    const operation = {
      id: 'op-1',
      type: 'CREATE_LIST',
      data: { id: 'list-1', title: 'New List' },
      retries: 0,
    }

    // Use a dynamic queue that updates when incrementRetry or dequeue is called
    let queue = [{ ...operation }]
    offlineQueue.getAll.mockImplementation(() => [...queue])
    offlineQueue.incrementRetry.mockImplementation((id) => {
      queue = queue.map(op => 
        op.id === id ? { ...op, retries: (op.retries || 0) + 1 } : op
      )
      return true
    })
    offlineQueue.dequeue.mockImplementation((id) => {
      queue = queue.filter(op => op.id !== id)
      return true
    })

    // First attempt fails
    api.createList.mockRejectedValueOnce(new Error('Network error'))

    await act(async () => {
      await result.current.syncQueue()
    })

    await waitFor(() => {
      expect(offlineQueue.incrementRetry).toHaveBeenCalledWith('op-1')
      expect(offlineQueue.dequeue).not.toHaveBeenCalled()
    })

    // Second attempt succeeds
    api.createList.mockResolvedValueOnce({ id: 'list-1', title: 'New List' })

    await act(async () => {
      await result.current.syncQueue()
    })

    await waitFor(() => {
      expect(api.createList).toHaveBeenCalledTimes(2)
      expect(offlineQueue.dequeue).toHaveBeenCalledWith('op-1')
    })
  }, 10000)

  it('should handle multiple operation types in sequence', async () => {
    const { result } = renderHook(() => useOfflineSync())

    const operations = [
      {
        id: 'op-1',
        type: 'CREATE_LIST',
        data: { id: 'list-1', title: 'List 1' },
        retries: 0,
      },
      {
        id: 'op-2',
        type: 'UPDATE_LIST',
        data: { listId: 'list-1', updates: { title: 'Updated List' } },
        retries: 0,
      },
      {
        id: 'op-3',
        type: 'CREATE_CARD',
        data: { listId: 'list-1', card: { id: 'card-1', title: 'Card 1' } },
        retries: 0,
      },
      {
        id: 'op-4',
        type: 'UPDATE_CARD',
        data: {
          listId: 'list-1',
          cardId: 'card-1',
          updates: { title: 'Updated Card' },
        },
        retries: 0,
      },
    ]

    // Use a dynamic queue that updates when dequeue is called
    let queue = [...operations]
    offlineQueue.getAll.mockImplementation(() => [...queue])
    offlineQueue.dequeue.mockImplementation((id) => {
      queue = queue.filter(op => op.id !== id)
      return true
    })
    api.createList.mockResolvedValue({ id: 'list-1', title: 'List 1' })
    api.updateList.mockResolvedValue({ id: 'list-1', title: 'Updated List' })
    api.createCard.mockResolvedValue({ id: 'card-1', title: 'Card 1' })
    api.updateCard.mockResolvedValue({ id: 'card-1', title: 'Updated Card' })

    await act(async () => {
      await result.current.syncQueue()
    })

    await waitFor(() => {
      expect(api.createList).toHaveBeenCalled()
      expect(api.updateList).toHaveBeenCalled()
      expect(api.createCard).toHaveBeenCalled()
      expect(api.updateCard).toHaveBeenCalled()
      expect(offlineQueue.dequeue).toHaveBeenCalledTimes(4)
    })
  }, 10000)

  it('should handle periodic sync interval', async () => {
    jest.useFakeTimers()
    const { result } = renderHook(() =>
      useOfflineSync(undefined, { syncInterval: 1000 })
    )

    const operation = {
      id: 'op-1',
      type: 'CREATE_LIST',
      data: { id: 'list-1', title: 'New List' },
      retries: 0,
    }

    // Use a dynamic queue that updates when dequeue is called
    let queue = [operation]
    offlineQueue.getAll.mockImplementation(() => [...queue])
    offlineQueue.dequeue.mockImplementation((id) => {
      queue = queue.filter(op => op.id !== id)
      return true
    })
    api.createList.mockResolvedValue({ id: 'list-1', title: 'New List' })

    // Fast-forward time to trigger periodic sync
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    await waitFor(() => {
      expect(api.createList).toHaveBeenCalled()
    })

    jest.useRealTimers()
  }, 10000)
})

