import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import { boardReducer, ACTION_TYPES } from './boardReducer'
import { storage } from '../services/storage'

const BoardContext = createContext(null)

export function useBoardContext() {
  const context = useContext(BoardContext)
  if (!context) {
    throw new Error('useBoardContext must be used within BoardProvider')
  }
  return context
}

function BoardProvider({ children }) {
  const [state, dispatch] = useReducer(boardReducer, { lists: [] })

  // Load board from storage on mount
  useEffect(() => {
    const savedData = storage.load()
    if (savedData && savedData.lists && Array.isArray(savedData.lists)) {
      // Validate and sanitize loaded data
      const sanitizedData = {
        lists: savedData.lists.map((list) => ({
          ...list,
          id: String(list.id || ''),
          title: String(list.title || 'Untitled List'),
          cards: Array.isArray(list.cards)
            ? list.cards.map((card) => ({
                ...card,
                id: String(card.id || ''),
                title: String(card.title || 'Untitled Card'),
                description: String(card.description || ''),
                tags: Array.isArray(card.tags) ? card.tags : [],
              }))
            : [],
          archived: Boolean(list.archived),
        })),
      }
      dispatch({ type: ACTION_TYPES.LOAD_BOARD, payload: sanitizedData })
    }
  }, [])

  // Save board to storage whenever state changes
  useEffect(() => {
    if (state.lists.length > 0 || storage.load()) {
      storage.save(state)
    }
  }, [state])

  const addList = useCallback((title) => {
    dispatch({ type: ACTION_TYPES.ADD_LIST, payload: { title } })
  }, [])

  const renameList = useCallback((listId, newTitle) => {
    dispatch({ type: ACTION_TYPES.RENAME_LIST, payload: { listId, newTitle } })
  }, [])

  const archiveList = useCallback((listId) => {
    dispatch({ type: ACTION_TYPES.ARCHIVE_LIST, payload: { listId } })
  }, [])

  const addCard = useCallback((listId, card) => {
    dispatch({ type: ACTION_TYPES.ADD_CARD, payload: { listId, card } })
  }, [])

  const updateCard = useCallback((listId, cardId, updates) => {
    dispatch({
      type: ACTION_TYPES.UPDATE_CARD,
      payload: { listId, cardId, updates },
    })
  }, [])

  const deleteCard = useCallback((listId, cardId) => {
    dispatch({ type: ACTION_TYPES.DELETE_CARD, payload: { listId, cardId } })
  }, [])

  const moveCard = useCallback(
    (cardId, sourceListId, destinationListId, destinationIndex) => {
      dispatch({
        type: ACTION_TYPES.MOVE_CARD,
        payload: {
          cardId,
          sourceListId,
          destinationListId,
          destinationIndex,
        },
      })
    },
    []
  )

  const reorderCard = useCallback((listId, cardId, newIndex) => {
    dispatch({
      type: ACTION_TYPES.REORDER_CARD,
      payload: { listId, cardId, newIndex },
    })
  }, [])

  const value = {
    state,
    addList,
    renameList,
    archiveList,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    reorderCard,
  }

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
}

BoardProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export default BoardProvider
