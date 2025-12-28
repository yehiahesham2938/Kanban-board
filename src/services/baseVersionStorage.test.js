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
    localStorageMock.setItem('kanban-board-base-version', JSON.stringify(data))
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
      'kanban-board-base-version'
    )
  })

  it('should handle invalid JSON gracefully', () => {
    localStorageMock.setItem('kanban-board-base-version', 'invalid json')
    const result = baseVersionStorage.load()
    expect(result).toBeNull()
  })
})

