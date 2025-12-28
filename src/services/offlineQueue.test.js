import { offlineQueue } from './offlineQueue'

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString()
    }),
    removeItem: jest.fn((key) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('offlineQueue service', () => {
  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  it('should enqueue an operation', () => {
    const operation = {
      type: 'CREATE_LIST',
      data: { id: 'list-1', title: 'Test' },
    }
    const result = offlineQueue.enqueue(operation)
    expect(result).toBe(true)
    expect(localStorageMock.setItem).toHaveBeenCalled()
    const operations = offlineQueue.getAll()
    expect(operations).toHaveLength(1)
    expect(operations[0].type).toBe('CREATE_LIST')
  })

  it('should get all queued operations', () => {
    const operation1 = {
      type: 'CREATE_LIST',
      payload: { id: 'list-1', title: 'Test 1' },
    }
    const operation2 = {
      type: 'CREATE_CARD',
      payload: { id: 'card-1', title: 'Card 1' },
    }

    offlineQueue.enqueue(operation1)
    offlineQueue.enqueue(operation2)

    const operations = offlineQueue.getAll()
    expect(operations).toHaveLength(2)
    expect(operations[0].type).toBe('CREATE_LIST')
    expect(operations[1].type).toBe('CREATE_CARD')
  })

  it('should remove an operation', () => {
    const operation = {
      type: 'CREATE_LIST',
      payload: { id: 'list-1', title: 'Test' },
    }
    offlineQueue.enqueue(operation)
    const operations = offlineQueue.getAll()
    expect(operations).toHaveLength(1)
    offlineQueue.dequeue(operations[0].id)
    const remainingOperations = offlineQueue.getAll()
    expect(remainingOperations).toHaveLength(0)
  })

  it('should clear all operations', () => {
    offlineQueue.enqueue({ type: 'CREATE_LIST', payload: {} })
    offlineQueue.enqueue({ type: 'CREATE_CARD', payload: {} })
    offlineQueue.clear()
    const operations = offlineQueue.getAll()
    expect(operations).toHaveLength(0)
  })

  it('should return empty array when no operations exist', () => {
    const operations = offlineQueue.getAll()
    expect(operations).toEqual([])
  })

  it('should increment retry count for an operation', () => {
    const operation = {
      type: 'CREATE_LIST',
      payload: { id: 'list-1', title: 'Test' },
    }
    offlineQueue.enqueue(operation)
    const operations = offlineQueue.getAll()
    expect(operations).toHaveLength(1)
    expect(operations[0].retries).toBe(0)

    offlineQueue.incrementRetry(operations[0].id)
    const updatedOperations = offlineQueue.getAll()
    expect(updatedOperations[0].retries).toBe(1)

    offlineQueue.incrementRetry(operations[0].id)
    const finalOperations = offlineQueue.getAll()
    expect(finalOperations[0].retries).toBe(2)
  })

  it('should handle incrementRetry for non-existent operation', () => {
    const result = offlineQueue.incrementRetry('non-existent-id')
    expect(result).toBe(true) // Should not throw, just return true
  })

  it('should handle error in getAll when localStorage fails', () => {
    const originalGetItem = localStorageMock.getItem
    localStorageMock.getItem = jest.fn(() => {
      throw new Error('Storage error')
    })

    const operations = offlineQueue.getAll()
    expect(operations).toEqual([])

    localStorageMock.getItem = originalGetItem
  })

  it('should handle error in enqueue when localStorage fails', () => {
    const originalSetItem = localStorageMock.setItem
    localStorageMock.setItem = jest.fn(() => {
      throw new Error('Storage error')
    })

    const operation = {
      type: 'CREATE_LIST',
      payload: { id: 'list-1', title: 'Test' },
    }
    const result = offlineQueue.enqueue(operation)
    expect(result).toBe(false)

    localStorageMock.setItem = originalSetItem
  })

  it('should sanitize operation data correctly', () => {
    const operation = {
      type: 'CREATE_LIST',
      data: {
        id: 'list-1',
        title: 'Test',
        func: () => {}, // Should be removed
        undefinedValue: undefined, // Should be removed
      },
    }
    offlineQueue.enqueue(operation)
    const operations = offlineQueue.getAll()
    expect(operations).toHaveLength(1)
    expect(operations[0].data.func).toBeUndefined()
    expect(operations[0].data.undefinedValue).toBeUndefined()
    expect(operations[0].data.id).toBe('list-1')
    expect(operations[0].data.title).toBe('Test')
  })
})

