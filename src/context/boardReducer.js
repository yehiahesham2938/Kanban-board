import { validators } from '../utils/validators'
import { helpers } from '../utils/helpers'

export const ACTION_TYPES = {
  LOAD_BOARD: 'LOAD_BOARD',
  ADD_LIST: 'ADD_LIST',
  RENAME_LIST: 'RENAME_LIST',
  ARCHIVE_LIST: 'ARCHIVE_LIST',
  ADD_CARD: 'ADD_CARD',
  UPDATE_CARD: 'UPDATE_CARD',
  DELETE_CARD: 'DELETE_CARD',
  MOVE_CARD: 'MOVE_CARD',
  REORDER_CARD: 'REORDER_CARD',
}

export function boardReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.LOAD_BOARD: {
      return action.payload || { lists: [] }
    }

    case ACTION_TYPES.ADD_LIST: {
      const now = new Date().toISOString()
      const newList = {
        id: action.payload.id || helpers.generateId(),
        title: action.payload.title || 'New List',
        cards: action.payload.cards || [],
        archived: action.payload.archived || false,
        version: 1,
        lastModifiedAt: now,
        createdAt: now,
      }
      return {
        ...state,
        lists: [...state.lists, newList],
      }
    }

    case ACTION_TYPES.RENAME_LIST: {
      const { listId, newTitle } = action.payload
      if (!validators.isNotEmpty(newTitle)) return state

      return {
        ...state,
        lists: state.lists.map((list) =>
          list.id === listId
            ? {
                ...list,
                title: newTitle,
                version: (list.version || 1) + 1,
                lastModifiedAt: new Date().toISOString(),
              }
            : list
        ),
      }
    }

    case ACTION_TYPES.ARCHIVE_LIST: {
      const { listId } = action.payload
      return {
        ...state,
        lists: state.lists.map((list) =>
          list.id === listId
            ? {
                ...list,
                archived: true,
                version: (list.version || 1) + 1,
                lastModifiedAt: new Date().toISOString(),
              }
            : list
        ),
      }
    }

    case ACTION_TYPES.ADD_CARD: {
      const { listId, card } = action.payload
      const now = new Date().toISOString()
      const newCard = {
        id: card.id || helpers.generateId(),
        title: card.title || 'New Card',
        description: card.description || '',
        tags: card.tags || [],
        version: 1,
        lastModifiedAt: now,
        createdAt: now,
        updatedAt: now,
      }

      return {
        ...state,
        lists: state.lists.map((list) =>
          list.id === listId
            ? {
                ...list,
                cards: [...list.cards, newCard],
                version: (list.version || 1) + 1,
                lastModifiedAt: now,
              }
            : list
        ),
      }
    }

    case ACTION_TYPES.UPDATE_CARD: {
      const { listId, cardId, updates } = action.payload
      const now = new Date().toISOString()
      return {
        ...state,
        lists: state.lists.map((list) => {
          if (list.id !== listId) return list
          return {
            ...list,
            cards: list.cards.map((card) =>
              card.id === cardId
                ? {
                    ...card,
                    ...updates,
                    version: (card.version || 1) + 1,
                    lastModifiedAt: now,
                    updatedAt: now,
                  }
                : card
            ),
            version: (list.version || 1) + 1,
            lastModifiedAt: now,
          }
        }),
      }
    }

    case ACTION_TYPES.DELETE_CARD: {
      const { listId, cardId } = action.payload
      const now = new Date().toISOString()
      return {
        ...state,
        lists: state.lists.map((list) =>
          list.id === listId
            ? {
                ...list,
                cards: list.cards.filter((card) => card.id !== cardId),
                version: (list.version || 1) + 1,
                lastModifiedAt: now,
              }
            : list
        ),
      }
    }

    case ACTION_TYPES.MOVE_CARD: {
      const { cardId, sourceListId, destinationListId, destinationIndex } =
        action.payload

      const sourceList = state.lists.find((list) => list.id === sourceListId)
      const destinationList = state.lists.find(
        (list) => list.id === destinationListId
      )

      if (!sourceList || !destinationList) return state

      const card = sourceList.cards.find((c) => c.id === cardId)
      if (!card) return state

      const now = new Date().toISOString()
      const updatedCard = {
        ...card,
        version: (card.version || 1) + 1,
        lastModifiedAt: now,
        updatedAt: now,
      }

      const newSourceCards = sourceList.cards.filter((c) => c.id !== cardId)
      const newDestinationCards = [...destinationList.cards]
      newDestinationCards.splice(destinationIndex, 0, updatedCard)

      return {
        ...state,
        lists: state.lists.map((list) => {
          if (list.id === sourceListId) {
            return {
              ...list,
              cards: newSourceCards,
              version: (list.version || 1) + 1,
              lastModifiedAt: now,
            }
          }
          if (list.id === destinationListId) {
            return {
              ...list,
              cards: newDestinationCards,
              version: (list.version || 1) + 1,
              lastModifiedAt: now,
            }
          }
          return list
        }),
      }
    }

    case ACTION_TYPES.REORDER_CARD: {
      const { listId, cardId, newIndex, destinationIndex } = action.payload
      const targetIndex = newIndex !== undefined ? newIndex : destinationIndex

      const list = state.lists.find((l) => l.id === listId)
      if (!list) return state

      const cardIndex = list.cards.findIndex((c) => c.id === cardId)
      if (cardIndex === -1) return state

      const now = new Date().toISOString()
      const newCards = [...list.cards]
      const [movedCard] = newCards.splice(cardIndex, 1)
      const updatedCard = {
        ...movedCard,
        version: (movedCard.version || 1) + 1,
        lastModifiedAt: now,
        updatedAt: now,
      }
      newCards.splice(targetIndex, 0, updatedCard)

      return {
        ...state,
        lists: state.lists.map((l) =>
          l.id === listId
            ? {
                ...l,
                cards: newCards,
                version: (l.version || 1) + 1,
                lastModifiedAt: now,
              }
            : l
        ),
      }
    }

    default:
      return state
  }
}
