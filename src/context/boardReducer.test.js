import { boardReducer, ACTION_TYPES } from './boardReducer'
import { helpers } from '../utils/helpers'

// Mock UUID generation
jest.mock('../utils/helpers', () => ({
  helpers: {
    generateId: jest.fn(() => 'mock-id'),
  },
}))

describe('boardReducer', () => {
  const initialState = { lists: [] }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('LOAD_BOARD', () => {
    it('should load board state', () => {
      const payload = {
        lists: [
          { id: 'list-1', title: 'List 1', cards: [], archived: false },
        ],
      }
      const action = { type: ACTION_TYPES.LOAD_BOARD, payload }
      const result = boardReducer(initialState, action)
      expect(result).toEqual(payload)
    })

    it('should return empty state if payload is null', () => {
      const action = { type: ACTION_TYPES.LOAD_BOARD, payload: null }
      const result = boardReducer(initialState, action)
      expect(result).toEqual({ lists: [] })
    })
  })

  describe('ADD_LIST', () => {
    it('should add a new list', () => {
      const action = {
        type: ACTION_TYPES.ADD_LIST,
        payload: {
          id: 'list-1',
          title: 'New List',
          cards: [],
          archived: false,
        },
      }
      const result = boardReducer(initialState, action)
      expect(result.lists).toHaveLength(1)
      expect(result.lists[0].title).toBe('New List')
      expect(result.lists[0].id).toBe('list-1')
    })

    it('should add list with version and lastModifiedAt', () => {
      const action = {
        type: ACTION_TYPES.ADD_LIST,
        payload: {
          id: 'list-1',
          title: 'New List',
          cards: [],
          archived: false,
        },
      }
      const result = boardReducer(initialState, action)
      expect(result.lists[0]).toHaveProperty('version')
      expect(result.lists[0]).toHaveProperty('lastModifiedAt')
    })
  })

  describe('RENAME_LIST', () => {
    it('should rename an existing list', () => {
      const state = {
        lists: [
          { id: 'list-1', title: 'Old Title', cards: [], archived: false },
        ],
      }
      const action = {
        type: ACTION_TYPES.RENAME_LIST,
        payload: { listId: 'list-1', newTitle: 'New Title' },
      }
      const result = boardReducer(state, action)
      expect(result.lists[0].title).toBe('New Title')
    })

    it('should update version and lastModifiedAt when renaming', () => {
      const state = {
        lists: [
          {
            id: 'list-1',
            title: 'Old Title',
            cards: [],
            archived: false,
            version: 1,
            lastModifiedAt: '2023-01-01',
          },
        ],
      }
      const action = {
        type: ACTION_TYPES.RENAME_LIST,
        payload: { listId: 'list-1', newTitle: 'New Title' },
      }
      const result = boardReducer(state, action)
      expect(result.lists[0].version).toBeGreaterThan(1)
      expect(result.lists[0].lastModifiedAt).toBeTruthy()
    })
  })

  describe('ARCHIVE_LIST', () => {
    it('should archive a list', () => {
      const state = {
        lists: [
          { id: 'list-1', title: 'List 1', cards: [], archived: false },
        ],
      }
      const action = {
        type: ACTION_TYPES.ARCHIVE_LIST,
        payload: { listId: 'list-1' },
      }
      const result = boardReducer(state, action)
      expect(result.lists[0].archived).toBe(true)
    })
  })

  describe('ADD_CARD', () => {
    it('should add a card to a list', () => {
      const state = {
        lists: [
          { id: 'list-1', title: 'List 1', cards: [], archived: false },
        ],
      }
      const action = {
        type: ACTION_TYPES.ADD_CARD,
        payload: {
          listId: 'list-1',
          card: {
            id: 'card-1',
            title: 'New Card',
            description: 'Description',
            tags: [],
          },
        },
      }
      const result = boardReducer(state, action)
      expect(result.lists[0].cards).toHaveLength(1)
      expect(result.lists[0].cards[0].title).toBe('New Card')
    })

    it('should add card with version and lastModifiedAt', () => {
      const state = {
        lists: [
          { id: 'list-1', title: 'List 1', cards: [], archived: false },
        ],
      }
      const action = {
        type: ACTION_TYPES.ADD_CARD,
        payload: {
          listId: 'list-1',
          card: {
            id: 'card-1',
            title: 'New Card',
            description: 'Description',
            tags: [],
          },
        },
      }
      const result = boardReducer(state, action)
      expect(result.lists[0].cards[0]).toHaveProperty('version')
      expect(result.lists[0].cards[0]).toHaveProperty('lastModifiedAt')
    })
  })

  describe('UPDATE_CARD', () => {
    it('should update a card', () => {
      const state = {
        lists: [
          {
            id: 'list-1',
            title: 'List 1',
            cards: [
              { id: 'card-1', title: 'Old Title', description: '', tags: [] },
            ],
            archived: false,
          },
        ],
      }
      const action = {
        type: ACTION_TYPES.UPDATE_CARD,
        payload: {
          listId: 'list-1',
          cardId: 'card-1',
          updates: { title: 'New Title', description: 'New Description' },
        },
      }
      const result = boardReducer(state, action)
      expect(result.lists[0].cards[0].title).toBe('New Title')
      expect(result.lists[0].cards[0].description).toBe('New Description')
    })
  })

  describe('DELETE_CARD', () => {
    it('should delete a card from a list', () => {
      const state = {
        lists: [
          {
            id: 'list-1',
            title: 'List 1',
            cards: [
              { id: 'card-1', title: 'Card 1', description: '', tags: [] },
              { id: 'card-2', title: 'Card 2', description: '', tags: [] },
            ],
            archived: false,
          },
        ],
      }
      const action = {
        type: ACTION_TYPES.DELETE_CARD,
        payload: { listId: 'list-1', cardId: 'card-1' },
      }
      const result = boardReducer(state, action)
      expect(result.lists[0].cards).toHaveLength(1)
      expect(result.lists[0].cards[0].id).toBe('card-2')
    })
  })

  describe('MOVE_CARD', () => {
    it('should move a card from one list to another', () => {
      const state = {
        lists: [
          {
            id: 'list-1',
            title: 'List 1',
            cards: [{ id: 'card-1', title: 'Card 1', description: '', tags: [] }],
            archived: false,
          },
          {
            id: 'list-2',
            title: 'List 2',
            cards: [],
            archived: false,
          },
        ],
      }
      const action = {
        type: ACTION_TYPES.MOVE_CARD,
        payload: {
          cardId: 'card-1',
          sourceListId: 'list-1',
          destinationListId: 'list-2',
          destinationIndex: 0,
        },
      }
      const result = boardReducer(state, action)
      expect(result.lists[0].cards).toHaveLength(0)
      expect(result.lists[1].cards).toHaveLength(1)
      expect(result.lists[1].cards[0].id).toBe('card-1')
    })
  })

  describe('REORDER_CARD', () => {
    it('should reorder a card within the same list', () => {
      const state = {
        lists: [
          {
            id: 'list-1',
            title: 'List 1',
            cards: [
              { id: 'card-1', title: 'Card 1', description: '', tags: [] },
              { id: 'card-2', title: 'Card 2', description: '', tags: [] },
              { id: 'card-3', title: 'Card 3', description: '', tags: [] },
            ],
            archived: false,
          },
        ],
      }
      const action = {
        type: ACTION_TYPES.REORDER_CARD,
        payload: {
          listId: 'list-1',
          cardId: 'card-1',
          destinationIndex: 2,
        },
      }
      const result = boardReducer(state, action)
      expect(result.lists[0].cards[2].id).toBe('card-1')
      expect(result.lists[0].cards[0].id).toBe('card-2')
    })
  })

  describe('Unknown action', () => {
    it('should return current state for unknown action', () => {
      const action = { type: 'UNKNOWN_ACTION' }
      const result = boardReducer(initialState, action)
      expect(result).toBe(initialState)
    })
  })
})

