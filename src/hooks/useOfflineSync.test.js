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

  it('should sync CREATE_LIST operation', async () => {
    const operation = {
      id: '1',
      type: 'CREATE_LIST',
      data: { id: 'list-1', title: 'Test List' },
    }

    offlineQueue.getAll.mockReturnValue([operation])
    api.createList.mockResolvedValue({ id: 'list-1', title: 'Test List' })

    const { result } = renderHook(() => useOfflineSync())

    await act(async () => {
      await result.current.syncQueue()
    })

    expect(api.createList).toHaveBeenCalledWith(operation.data)
    expect(offlineQueue.dequeue).toHaveBeenCalledWith('1')
  })

  it('should sync CREATE_CARD operation', async () => {
    const operation = {
      id: '1',
      type: 'CREATE_CARD',
      data: { listId: 'list-1', card: { id: 'card-1', title: 'Test Card' } },
    }

    offlineQueue.getAll.mockReturnValue([operation])
    api.createCard.mockResolvedValue({ id: 'card-1', title: 'Test Card' })

    const { result } = renderHook(() => useOfflineSync())

    await act(async () => {
      await result.current.syncQueue()
    })

    expect(api.createCard).toHaveBeenCalledWith(
      operation.data.listId,
      operation.data.card
    )
    expect(offlineQueue.dequeue).toHaveBeenCalledWith('1')
  })

  it('should handle sync errors and retry', async () => {
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
  })

  it('should call onSyncError after max retries', async () => {
    const onSyncError = jest.fn()
    const operation = {
      id: '1',
      type: 'CREATE_LIST',
      data: { id: 'list-1', title: 'Test List' },
      retries: 3,
    }

    offlineQueue.getAll.mockReturnValue([operation])
    api.createList.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useOfflineSync(onSyncError, { maxRetries: 3 }))

    await act(async () => {
      await result.current.syncQueue()
    })

    expect(onSyncError).toHaveBeenCalledWith(
      operation,
      expect.any(Error)
    )
    expect(offlineQueue.dequeue).toHaveBeenCalledWith('1')
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

  it('should not sync when already syncing', async () => {
    offlineQueue.getAll.mockReturnValue([
      { id: '1', type: 'CREATE_LIST', data: {} },
    ])

    const { result } = renderHook(() => useOfflineSync())

    // Start sync
    act(() => {
      result.current.syncQueue()
    })

    // Try to sync again while syncing
    await act(async () => {
      await result.current.syncQueue()
    })

    // Should only be called once
    expect(api.createList).toHaveBeenCalledTimes(1)
  })

  it('should clear error', () => {
    const { result } = renderHook(() => useOfflineSync())

    act(() => {
      result.current.clearError()
    })

    expect(result.current.syncError).toBe(null)
  })
})

