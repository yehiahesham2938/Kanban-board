import { baseVersionStorage } from './baseVersionStorage'

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

describe('baseVersionStorage service', () => {
  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  it('should save base version', () => {
    const data = {
      lists: [
        {
          id: 'list-1',
          title: 'Test List',
          version: 1,
          cards: [],
        },
      ],
    }
    baseVersionStorage.save(data)
    expect(localStorageMock.setItem).toHaveBeenCalled()
  })

  it('should load base version', () => {
    const data = {
      lists: [
        {
          id: 'list-1',
          title: 'Test List',
          version: 1,
          cards: [],
        },
      ],
    }
    localStorageMock.setItem('kanban-base-version', JSON.stringify(data))
    const result = baseVersionStorage.load()
    expect(result).toEqual(data)
  })

  it('should return null when no base version exists', () => {
    const result = baseVersionStorage.load()
    expect(result).toBeNull()
  })

  it('should clear base version', () => {
    baseVersionStorage.clear()
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(
      'kanban-base-version'
    )
  })

  it('should handle invalid JSON gracefully', () => {
    localStorageMock.setItem('kanban-base-version', 'invalid json')
    const result = baseVersionStorage.load()
    expect(result).toBeNull()
  })

  it('should handle save error gracefully', () => {
    const originalSetItem = localStorageMock.setItem
    localStorageMock.setItem = jest.fn(() => {
      throw new Error('Storage error')
    })

    const data = { lists: [] }
    const result = baseVersionStorage.save(data)
    expect(result).toBe(false)

    localStorageMock.setItem = originalSetItem
  })

  it('should handle load error gracefully', () => {
    const originalGetItem = localStorageMock.getItem
    localStorageMock.getItem = jest.fn(() => {
      throw new Error('Storage error')
    })

    const result = baseVersionStorage.load()
    expect(result).toBeNull()

    localStorageMock.getItem = originalGetItem
  })

  it('should handle clear error gracefully', () => {
    const originalRemoveItem = localStorageMock.removeItem
    localStorageMock.removeItem = jest.fn(() => {
      throw new Error('Storage error')
    })

    const result = baseVersionStorage.clear()
    expect(result).toBe(false)

    localStorageMock.removeItem = originalRemoveItem
  })

  it('should sanitize data when saving', () => {
    const data = {
      lists: [
        {
          id: 'list-1',
          title: 'Test',
          version: 2,
          lastModifiedAt: '2024-01-01',
          cards: [
            {
              id: 'card-1',
              title: 'Card',
              version: 1,
              lastModifiedAt: '2024-01-01',
            },
          ],
        },
      ],
    }
    const result = baseVersionStorage.save(data)
    expect(result).toBe(true)
    expect(localStorageMock.setItem).toHaveBeenCalled()
  })
})

