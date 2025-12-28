import { renderHook, act } from '@testing-library/react'
import { render } from '@testing-library/react'
import { useBoardState } from './useBoardState'
import BoardProvider from '../context/BoardProvider'

// Mock the services to avoid actual API calls
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

// Mock the BoardProvider context
const wrapper = ({ children }) => (
  <BoardProvider>{children}</BoardProvider>
)

describe('useBoardState', () => {
  it('should return board state and action functions', () => {
    const { result } = renderHook(() => useBoardState(), { wrapper })

    expect(result.current).toHaveProperty('state')
    expect(result.current).toHaveProperty('addList')
    expect(result.current).toHaveProperty('renameList')
    expect(result.current).toHaveProperty('archiveList')
    expect(result.current).toHaveProperty('addCard')
    expect(result.current).toHaveProperty('updateCard')
    expect(result.current).toHaveProperty('deleteCard')
    expect(result.current).toHaveProperty('moveCard')
    expect(result.current).toHaveProperty('reorderCard')
    expect(result.current).toHaveProperty('getList')
    expect(result.current).toHaveProperty('getCard')
    expect(result.current).toHaveProperty('activeLists')
    expect(result.current).toHaveProperty('error')
    expect(result.current).toHaveProperty('clearError')
  })

  it('should have initial empty state', () => {
    const { result } = renderHook(() => useBoardState(), { wrapper })

    expect(result.current.state).toHaveProperty('lists')
    expect(Array.isArray(result.current.state.lists)).toBe(true)
  })

  it('should add a list', async () => {
    const { result } = renderHook(() => useBoardState(), { wrapper })

    await act(async () => {
      await result.current.addList('Test List')
    })

    expect(result.current.state.lists.length).toBe(1)
    expect(result.current.state.lists[0].title).toBe('Test List')
    expect(result.current.activeLists.length).toBe(1)
  })

  it('should get a list by ID', async () => {
    const { result } = renderHook(() => useBoardState(), { wrapper })

    await act(async () => {
      await result.current.addList('Test List')
    })

    const list = result.current.state.lists[0]
    const foundList = result.current.getList(list.id)

    expect(foundList).toBeDefined()
    expect(foundList.id).toBe(list.id)
    expect(foundList.title).toBe('Test List')
  })

  it('should rename a list', async () => {
    const { result } = renderHook(() => useBoardState(), { wrapper })

    await act(async () => {
      await result.current.addList('Original Title')
    })

    const list = result.current.state.lists[0]

    await act(async () => {
      await result.current.renameList(list.id, 'New Title')
    })

    const updatedList = result.current.getList(list.id)
    expect(updatedList.title).toBe('New Title')
  })

  it('should archive a list', async () => {
    const { result } = renderHook(() => useBoardState(), { wrapper })

    await act(async () => {
      await result.current.addList('Test List')
    })

    const list = result.current.state.lists[0]
    expect(result.current.activeLists.length).toBe(1)

    await act(async () => {
      await result.current.archiveList(list.id)
    })

    expect(result.current.activeLists.length).toBe(0)
    const archivedList = result.current.getList(list.id)
    expect(archivedList.archived).toBe(true)
  })

  it('should add a card to a list', async () => {
    const { result } = renderHook(() => useBoardState(), { wrapper })

    await act(async () => {
      await result.current.addList('Test List')
    })

    const list = result.current.state.lists[0]

    await act(async () => {
      await result.current.addCard(list.id, { title: 'Test Card' })
    })

    const updatedList = result.current.getList(list.id)
    expect(updatedList.cards.length).toBe(1)
    expect(updatedList.cards[0].title).toBe('Test Card')
  })

  it('should get a card by ID', async () => {
    const { result } = renderHook(() => useBoardState(), { wrapper })

    await act(async () => {
      await result.current.addList('Test List')
    })

    const list = result.current.state.lists[0]

    await act(async () => {
      await result.current.addCard(list.id, { title: 'Test Card' })
    })

    const updatedList = result.current.getList(list.id)
    const card = updatedList.cards[0]
    const foundCard = result.current.getCard(card.id)

    expect(foundCard).toBeDefined()
    expect(foundCard.id).toBe(card.id)
    expect(foundCard.title).toBe('Test Card')
    expect(foundCard.listId).toBe(list.id)
  })

  it('should update a card', async () => {
    const { result } = renderHook(() => useBoardState(), { wrapper })

    await act(async () => {
      await result.current.addList('Test List')
    })

    const list = result.current.state.lists[0]

    await act(async () => {
      await result.current.addCard(list.id, { title: 'Original Title' })
    })

    const card = result.current.getList(list.id).cards[0]

    await act(async () => {
      await result.current.updateCard(list.id, card.id, {
        title: 'Updated Title',
        description: 'New description',
      })
    })

    const updatedCard = result.current.getList(list.id).cards[0]
    expect(updatedCard.title).toBe('Updated Title')
    expect(updatedCard.description).toBe('New description')
  })

  it('should delete a card', async () => {
    const { result } = renderHook(() => useBoardState(), { wrapper })

    await act(async () => {
      await result.current.addList('Test List')
    })

    const list = result.current.state.lists[0]

    await act(async () => {
      await result.current.addCard(list.id, { title: 'Test Card' })
    })

    const card = result.current.getList(list.id).cards[0]
    expect(result.current.getList(list.id).cards.length).toBe(1)

    await act(async () => {
      await result.current.deleteCard(list.id, card.id)
    })

    expect(result.current.getList(list.id).cards.length).toBe(0)
  })

  it('should return only active (non-archived) lists', async () => {
    const { result } = renderHook(() => useBoardState(), { wrapper })

    await act(async () => {
      await result.current.addList('List 1')
      await result.current.addList('List 2')
      await result.current.addList('List 3')
    })

    expect(result.current.activeLists.length).toBe(3)

    const list2 = result.current.state.lists[1]

    await act(async () => {
      await result.current.archiveList(list2.id)
    })

    expect(result.current.activeLists.length).toBe(2)
    expect(result.current.activeLists.every((list) => !list.archived)).toBe(true)
  })
})

