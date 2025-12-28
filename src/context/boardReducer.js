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
      const newList = {
        id: helpers.generateId(),
        title: action.payload.title || 'New List',
        cards: [],
        archived: false,
        createdAt: new Date().toISOString(),
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
          list.id === listId ? { ...list, title: newTitle } : list
        ),
      }
    }

    case ACTION_TYPES.ARCHIVE_LIST: {
      const { listId } = action.payload
      return {
        ...state,
        lists: state.lists.map((list) =>
          list.id === listId ? { ...list, archived: true } : list
        ),
      }
    }

    case ACTION_TYPES.ADD_CARD: {
      const { listId, card } = action.payload
      const newCard = {
        id: helpers.generateId(),
        title: card.title || 'New Card',
        description: card.description || '',
        tags: card.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      return {
        ...state,
        lists: state.lists.map((list) =>
          list.id === listId
            ? { ...list, cards: [...list.cards, newCard] }
            : list
        ),
      }
    }

    case ACTION_TYPES.UPDATE_CARD: {
      const { listId, cardId, updates } = action.payload
      return {
        ...state,
        lists: state.lists.map((list) => {
          if (list.id !== listId) return list
          return {
            ...list,
            cards: list.cards.map((card) =>
              card.id === cardId
                ? { ...card, ...updates, updatedAt: new Date().toISOString() }
                : card
            ),
          }
        }),
      }
    }

    case ACTION_TYPES.DELETE_CARD: {
      const { listId, cardId } = action.payload
      return {
        ...state,
        lists: state.lists.map((list) =>
          list.id === listId
            ? { ...list, cards: list.cards.filter((card) => card.id !== cardId) }
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

      const newSourceCards = sourceList.cards.filter((c) => c.id !== cardId)
      const newDestinationCards = [...destinationList.cards]
      newDestinationCards.splice(destinationIndex, 0, card)

      return {
        ...state,
        lists: state.lists.map((list) => {
          if (list.id === sourceListId) {
            return { ...list, cards: newSourceCards }
          }
          if (list.id === destinationListId) {
            return { ...list, cards: newDestinationCards }
          }
          return list
        }),
      }
    }

    case ACTION_TYPES.REORDER_CARD: {
      const { listId, cardId, newIndex } = action.payload

      const list = state.lists.find((l) => l.id === listId)
      if (!list) return state

      const cardIndex = list.cards.findIndex((c) => c.id === cardId)
      if (cardIndex === -1) return state

      const newCards = [...list.cards]
      const [movedCard] = newCards.splice(cardIndex, 1)
      newCards.splice(newIndex, 0, movedCard)

      return {
        ...state,
        lists: state.lists.map((l) =>
          l.id === listId ? { ...l, cards: newCards } : l
        ),
      }
    }

    default:
      return state
  }
}
