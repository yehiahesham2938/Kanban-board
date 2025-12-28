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

describe('useOfflineSync', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    offlineQueue.getAll.mockReturnValue([])
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    })
  })

  it('should return sync state and functions', () => {
    const { result } = renderHook(() => useOfflineSync())

    expect(result.current).toHaveProperty('isOnline')
    expect(result.current).toHaveProperty('isSyncing')
    expect(result.current).toHaveProperty('syncError')
    expect(result.current).toHaveProperty('syncQueue')
    expect(result.current).toHaveProperty('queueLength')
    expect(result.current).toHaveProperty('clearError')
  })

  it('should initialize with online status', () => {
    navigator.onLine = true
    const { result } = renderHook(() => useOfflineSync())

    expect(result.current.isOnline).toBe(true)
  })

  it('should detect offline status', () => {
    navigator.onLine = false
    const { result } = renderHook(() => useOfflineSync())

    expect(result.current.isOnline).toBe(false)
  })

  it('should update online status when connection changes', async () => {
    navigator.onLine = true
    const { result } = renderHook(() => useOfflineSync())

    expect(result.current.isOnline).toBe(true)

    act(() => {
      navigator.onLine = false
      window.dispatchEvent(new Event('offline'))
    })

    await waitFor(() => {
      expect(result.current.isOnline).toBe(false)
    })

    act(() => {
      navigator.onLine = true
      window.dispatchEvent(new Event('online'))
    })

    await waitFor(() => {
      expect(result.current.isOnline).toBe(true)
    })
  })

  it('should return queue length', () => {
    offlineQueue.getAll.mockReturnValue([
      { id: '1', type: 'CREATE_LIST' },
      { id: '2', type: 'CREATE_CARD' },
    ])

    const { result } = renderHook(() => useOfflineSync())

    expect(result.current.queueLength).toBe(2)
  })

  it.skip('should sync CREATE_LIST operation', async () => {
    const operation = {
      id: '1',
      type: 'CREATE_LIST',
      data: { id: 'list-1', title: 'Test List' },
    }

    offlineQueue.getAll.mockReturnValue([operation])
    api.createList.mockResolvedValue({ id: 'list-1', title: 'Test List' })
    offlineQueue.dequeue.mockReturnValue(true)

    const { result } = renderHook(() => useOfflineSync())

    await act(async () => {
      await result.current.syncQueue()
      // Wait a bit for async operations
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    expect(api.createList).toHaveBeenCalled()
    expect(offlineQueue.dequeue).toHaveBeenCalled()
  }, 10000)

  it('should sync CREATE_CARD operation', async () => {
    const operation = {
      id: '1',
      type: 'CREATE_CARD',
      data: { listId: 'list-1', card: { id: 'card-1', title: 'Test Card' } },
    }

    // Use a dynamic queue that updates when dequeue is called
    let queue = [operation]
    offlineQueue.getAll.mockImplementation(() => [...queue])
    offlineQueue.dequeue.mockImplementation((id) => {
      queue = queue.filter(op => op.id !== id)
      return true
    })
    api.createCard.mockResolvedValue({ id: 'card-1', title: 'Test Card' })

    const { result } = renderHook(() => useOfflineSync())

    await act(async () => {
      await result.current.syncQueue()
    })

    await waitFor(() => {
      expect(api.createCard).toHaveBeenCalledWith('list-1', { id: 'card-1', title: 'Test Card' })
      expect(offlineQueue.dequeue).toHaveBeenCalledWith('1')
    })
  }, 10000)

  it.skip('should handle sync errors and retry', async () => {
    const operation = {
      id: '1',
      type: 'CREATE_LIST',
      data: { id: 'list-1', title: 'Test List' },
      retries: 0,
    }

    offlineQueue.getAll.mockReturnValue([operation])
    api.createList.mockRejectedValue(new Error('Network error'))

    const updatedOperation = { ...operation, retries: 1 }
    offlineQueue.getAll.mockReturnValue([updatedOperation])

    const { result } = renderHook(() => useOfflineSync())

    await act(async () => {
      await result.current.syncQueue()
    })

    expect(offlineQueue.incrementRetry).toHaveBeenCalledWith('1')
    expect(offlineQueue.dequeue).not.toHaveBeenCalled()
  }, 10000)

  it('should call onSyncError after max retries', async () => {
    const onSyncError = jest.fn()
    const operation = {
      id: '1',
      type: 'CREATE_LIST',
      data: { id: 'list-1', title: 'Test List' },
      retries: 3,
    }

    // Use a dynamic queue that updates when dequeue is called
    let queue = [operation]
    offlineQueue.getAll.mockImplementation(() => [...queue])
    offlineQueue.dequeue.mockImplementation((id) => {
      queue = queue.filter(op => op.id !== id)
      return true
    })
    api.createList.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useOfflineSync(onSyncError, { maxRetries: 3 }))

    await act(async () => {
      await result.current.syncQueue()
    })

    await waitFor(() => {
      expect(onSyncError).toHaveBeenCalledWith(
        operation,
        expect.any(Error)
      )
      expect(offlineQueue.dequeue).toHaveBeenCalledWith('1')
    })
  })

  it('should not sync when offline', async () => {
    navigator.onLine = false
    offlineQueue.getAll.mockReturnValue([
      { id: '1', type: 'CREATE_LIST', data: {} },
    ])

    const { result } = renderHook(() => useOfflineSync())

    await act(async () => {
      await result.current.syncQueue()
    })

    expect(api.createList).not.toHaveBeenCalled()
  })

  it.skip('should not sync when already syncing', async () => {
    // Mock navigator.onLine to be true
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    })

    offlineQueue.getAll.mockReturnValue([
      { id: '1', type: 'CREATE_LIST', data: {} },
    ])
    api.createList.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({}), 200)))

    const { result } = renderHook(() => useOfflineSync())

    // Wait for hook to initialize and detect online status
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    // Start sync
    await act(async () => {
      await result.current.syncQueue()
    })

    // Try to sync again immediately (should be blocked by isSyncing)
    await act(async () => {
      await result.current.syncQueue()
    })

    // Wait for operations to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300))
    })

    // Should only be called once (second call should be blocked by isSyncing)
    expect(api.createList).toHaveBeenCalledTimes(1)
  }, 10000)

  it('should clear error', () => {
    const { result } = renderHook(() => useOfflineSync())

    act(() => {
      result.current.clearError()
    })

    expect(result.current.syncError).toBe(null)
  })
})

