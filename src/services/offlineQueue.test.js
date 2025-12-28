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
      payload: { id: 'list-1', title: 'Test' },
    }
    offlineQueue.enqueue(operation)
    expect(localStorageMock.setItem).toHaveBeenCalled()
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
    offlineQueue.remove(0)
    const operations = offlineQueue.getAll()
    expect(operations).toHaveLength(0)
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
})

