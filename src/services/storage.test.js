import { storage } from './storage'

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

describe('storage service', () => {
  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  it('should save data to localStorage', () => {
    const data = {
      lists: [
        {
          id: 'list-1',
          title: 'Test List',
          cards: [],
          archived: false,
        },
      ],
    }
    const result = storage.save(data)
    expect(result).toBe(true)
    expect(localStorageMock.setItem).toHaveBeenCalled()
  })

  it('should load data from localStorage', () => {
    const data = {
      lists: [
        {
          id: 'list-1',
          title: 'Test List',
          cards: [],
        },
      ],
    }
    localStorageMock.setItem('kanban-board-data', JSON.stringify(data))
    const result = storage.load()
    expect(result).toEqual(data)
  })

  it('should return null when no data exists', () => {
    const result = storage.load()
    expect(result).toBeNull()
  })

  it('should clear localStorage', () => {
    storage.clear()
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('kanban-board-data')
  })

  it('should handle invalid JSON gracefully', () => {
    localStorageMock.setItem('kanban-board-data', 'invalid json')
    const result = storage.load()
    expect(result).toBeNull()
  })

  it('should sanitize data before saving', () => {
    const data = {
      lists: [
        {
          id: 'list-1',
          title: 'Test',
          cards: [
            {
              id: 'card-1',
              title: 'Card',
              // Include version and lastModifiedAt
              version: 1,
              lastModifiedAt: '2023-01-01',
            },
          ],
          version: 1,
          lastModifiedAt: '2023-01-01',
        },
      ],
    }
    const result = storage.save(data)
    expect(result).toBe(true)
  })

  it('should handle save error gracefully', () => {
    const originalSetItem = localStorageMock.setItem
    localStorageMock.setItem = jest.fn(() => {
      throw new Error('Storage error')
    })

    const data = { lists: [] }
    const result = storage.save(data)
    expect(result).toBe(false)

    localStorageMock.setItem = originalSetItem
  })

  it('should handle load error gracefully', () => {
    const originalGetItem = localStorageMock.getItem
    localStorageMock.getItem = jest.fn(() => {
      throw new Error('Storage error')
    })

    const result = storage.load()
    expect(result).toBeNull()

    localStorageMock.getItem = originalGetItem
  })

  it('should handle clear error gracefully', () => {
    const originalRemoveItem = localStorageMock.removeItem
    localStorageMock.removeItem = jest.fn(() => {
      throw new Error('Storage error')
    })

    const result = storage.clear()
    expect(result).toBe(false)

    localStorageMock.removeItem = originalRemoveItem
  })
})

