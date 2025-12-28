import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useState,
  useRef,
} from 'react'
import PropTypes from 'prop-types'
import { boardReducer, ACTION_TYPES } from './boardReducer'
import { storage } from '../services/storage'
import { baseVersionStorage } from '../services/baseVersionStorage'
import { offlineQueue } from '../services/offlineQueue'
import { api } from '../services/api'
import { useOfflineSync } from '../hooks/useOfflineSync'
import { useSyncWithConflictResolution } from '../hooks/useSyncWithConflictResolution'

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
  const [error, setError] = useState(null)
  const [stateHistory, setStateHistory] = useState([])
  const [currentConflict, setCurrentConflict] = useState(null)
  const isSyncingRef = useRef(false)
  const lastSyncTimeRef = useRef(0)
  const hasLoadedRef = useRef(false) // Track if initial load has completed

  // Load board from storage on mount
  useEffect(() => {
    const savedData = storage.load()
    if (savedData && savedData.lists && Array.isArray(savedData.lists) && savedData.lists.length > 0) {
      // Validate and sanitize loaded data
      const sanitizedData = {
        lists: savedData.lists.map((list) => {
          // Ensure title is a string, not an object
          let title = list.title
          if (title && typeof title === 'object') {
            title = String(title)
          } else {
            title = String(list.title || 'Untitled List')
          }
          
          return {
            id: String(list.id || ''),
            title: title,
            cards: Array.isArray(list.cards)
              ? list.cards.map((card) => ({
                  id: String(card.id || ''),
                  title: String(card.title || 'Untitled Card'),
                  description: String(card.description || ''),
                  tags: Array.isArray(card.tags) ? card.tags.map(String) : [],
                  createdAt: String(card.createdAt || ''),
                  updatedAt: String(card.updatedAt || ''),
                }))
              : [],
            archived: Boolean(list.archived),
            createdAt: String(list.createdAt || ''),
          }
        }),
      }
      dispatch({ type: ACTION_TYPES.LOAD_BOARD, payload: sanitizedData })
      setStateHistory([sanitizedData])
      
      // Initialize base version if it doesn't exist
      const baseVersion = baseVersionStorage.load()
      if (!baseVersion) {
        baseVersionStorage.save(sanitizedData)
      }
    }
    // Mark as loaded after attempting to load (even if no data was found)
    hasLoadedRef.current = true
  }, [])

  // Save board to storage whenever state changes
  // BUT only after initial load has completed to prevent overwriting seeded data
  useEffect(() => {
    // Only save if:
    // 1. Initial load has completed (prevents overwriting on mount)
    // 2. State actually has lists (prevents saving empty state)
    if (hasLoadedRef.current && state.lists.length > 0) {
      storage.save(state)
    }
  }, [state])

  // Handle sync errors
  const handleSyncError = useCallback((operation, error) => {
    console.error('Sync error for operation:', operation, error)
    setError(`Failed to sync ${operation.type}: ${error.message}`)
  }, [])

  // Handle conflicts - use ref to avoid recreation
  const handleConflictRef = useRef((conflicts) => {
    if (conflicts.length > 0) {
      setCurrentConflict(conflicts[0]) // Show first conflict
    }
  })
  
  const handleConflict = useCallback((conflicts) => {
    handleConflictRef.current(conflicts)
  }, [])

  // Use offline sync hook
  const { isOnline, isSyncing, queueLength } = useOfflineSync(handleSyncError)

  // Use conflict resolution hook
  const { syncWithServer, resolveConflict, conflicts } =
    useSyncWithConflictResolution(handleConflict)

  // Rollback to previous state
  const rollback = useCallback(() => {
    if (stateHistory.length > 1) {
      const previousState = stateHistory[stateHistory.length - 2]
      // Create a deep copy to avoid circular references
      const sanitizedState = {
        lists: (previousState.lists || []).map((list) => ({
          id: String(list.id || ''),
          title: String(list.title || ''),
          cards: (list.cards || []).map((card) => ({
            id: String(card.id || ''),
            title: String(card.title || ''),
            description: String(card.description || ''),
            tags: Array.isArray(card.tags) ? card.tags.map(String) : [],
            createdAt: String(card.createdAt || ''),
            updatedAt: String(card.updatedAt || ''),
          })),
          archived: Boolean(list.archived),
          createdAt: String(list.createdAt || ''),
        })),
      }
      setStateHistory(stateHistory.slice(0, -1))
      dispatch({ type: ACTION_TYPES.LOAD_BOARD, payload: sanitizedState })
      storage.save(sanitizedState)
    }
  }, [stateHistory])

  // Optimistic update helper
  const optimisticUpdate = useCallback(
    async (action, apiCall, queueOperation) => {
      // Save current state for rollback (sanitize to avoid circular references)
      const previousState = {
        lists: (state.lists || []).map((list) => ({
          id: String(list.id || ''),
          title: String(list.title || ''),
          cards: (list.cards || []).map((card) => ({
            id: String(card.id || ''),
            title: String(card.title || ''),
            description: String(card.description || ''),
            tags: Array.isArray(card.tags) ? card.tags.map(String) : [],
            createdAt: String(card.createdAt || ''),
            updatedAt: String(card.updatedAt || ''),
          })),
          archived: Boolean(list.archived),
          createdAt: String(list.createdAt || ''),
        })),
      }
      setStateHistory((prev) => [...prev, previousState])

      // Optimistically update UI immediately (don't wait for API)
      dispatch(action)

      // Queue for offline sync (always queue, even if online)
      if (queueOperation) {
        offlineQueue.enqueue(queueOperation)
      }

      // Try to sync with server if online (but don't block UI)
      if (isOnline && apiCall) {
        // Don't await - let it run in background
        apiCall().catch((error) => {
          console.error('API call failed:', error)
          // Don't rollback - keep the optimistic update
          // The operation is already queued and will be retried
          // Only show error if it's a real server error (not network/offline)
          if (
            error.message &&
            !error.message.includes('offline') &&
            !error.message.includes('Could not establish connection')
          ) {
            // Don't show error for random MSW failures - they're expected
            // The optimistic update already happened, so the UI is updated
            // The change is queued and will sync automatically
          }
        })
      }
    },
    [state, isOnline]
  )

  const addList = useCallback(
    async (title) => {
      const listId = crypto.randomUUID()
      const action = {
        type: ACTION_TYPES.ADD_LIST,
        payload: { title },
      }

      try {
        await optimisticUpdate(
          action,
          () => api.createList({ id: listId, title, cards: [], archived: false }),
          {
            type: 'CREATE_LIST',
            data: { listId, title, cards: [], archived: false },
          }
        )
      } catch (error) {
        setError(`Failed to create list: ${error.message}`)
      }
    },
    [optimisticUpdate]
  )

  const renameList = useCallback(
    async (listId, newTitle) => {
      const action = {
        type: ACTION_TYPES.RENAME_LIST,
        payload: { listId, newTitle },
      }

      try {
        await optimisticUpdate(
          action,
          () => api.updateList(listId, { title: newTitle }),
          {
            type: 'UPDATE_LIST',
            data: { listId, updates: { title: newTitle } },
          }
        )
      } catch (error) {
        setError(`Failed to rename list: ${error.message}`)
      }
    },
    [optimisticUpdate]
  )

  const archiveList = useCallback(
    async (listId) => {
      const action = {
        type: ACTION_TYPES.ARCHIVE_LIST,
        payload: { listId },
      }

      try {
        await optimisticUpdate(
          action,
          () => api.deleteList(listId),
          {
            type: 'DELETE_LIST',
            data: { listId },
          }
        )
      } catch (error) {
        setError(`Failed to archive list: ${error.message}`)
      }
    },
    [optimisticUpdate]
  )

  const addCard = useCallback(
    async (listId, card) => {
      const cardId = crypto.randomUUID()
      const action = {
        type: ACTION_TYPES.ADD_CARD,
        payload: { listId, card: { ...card, id: cardId } },
      }

      try {
        await optimisticUpdate(
          action,
          () => api.createCard(listId, { ...card, id: cardId }),
          {
            type: 'CREATE_CARD',
            data: { listId, card: { ...card, id: cardId } },
          }
        )
      } catch (error) {
        setError(`Failed to create card: ${error.message}`)
      }
    },
    [optimisticUpdate]
  )

  const updateCard = useCallback(
    async (listId, cardId, updates) => {
      const action = {
        type: ACTION_TYPES.UPDATE_CARD,
        payload: { listId, cardId, updates },
      }

      try {
        await optimisticUpdate(
          action,
          () => api.updateCard(listId, cardId, updates),
          {
            type: 'UPDATE_CARD',
            data: { listId, cardId, updates },
          }
        )
      } catch (error) {
        setError(`Failed to update card: ${error.message}`)
      }
    },
    [optimisticUpdate]
  )

  const deleteCard = useCallback(
    async (listId, cardId) => {
      const action = {
        type: ACTION_TYPES.DELETE_CARD,
        payload: { listId, cardId },
      }

      try {
        await optimisticUpdate(
          action,
          () => api.deleteCard(listId, cardId),
          {
            type: 'DELETE_CARD',
            data: { listId, cardId },
          }
        )
      } catch (error) {
        setError(`Failed to delete card: ${error.message}`)
      }
    },
    [optimisticUpdate]
  )

  const moveCard = useCallback(
    async (cardId, sourceListId, destinationListId, destinationIndex) => {
      const action = {
        type: ACTION_TYPES.MOVE_CARD,
        payload: {
          cardId,
          sourceListId,
          destinationListId,
          destinationIndex,
        },
      }

      try {
        await optimisticUpdate(
          action,
          () =>
            api.moveCard(
              cardId,
              sourceListId,
              destinationListId,
              destinationIndex
            ),
          {
            type: 'MOVE_CARD',
            data: {
              cardId,
              sourceListId,
              destinationListId,
              destinationIndex,
            },
          }
        )
      } catch (error) {
        setError(`Failed to move card: ${error.message}`)
      }
    },
    [optimisticUpdate]
  )

  const reorderCard = useCallback(
    async (listId, cardId, newIndex) => {
      const action = {
        type: ACTION_TYPES.REORDER_CARD,
        payload: { listId, cardId, newIndex },
      }

      try {
        // Reordering within same list - queue for sync but no immediate API call
        // The move will be synced when online
        setStateHistory((prev) => [...prev, state])
        dispatch(action)
        offlineQueue.enqueue({
          type: 'MOVE_CARD',
          data: {
            cardId,
            sourceListId: listId,
            destinationListId: listId,
            destinationIndex: newIndex,
          },
        })
      } catch (error) {
        setError(`Failed to reorder card: ${error.message}`)
      }
    },
    [state]
  )

  // Handle conflict resolution
  const handleResolveConflict = useCallback(
    (conflictId, resolvedItem, type) => {
      if (type === 'list') {
        // Update the list in state
        dispatch({
          type: ACTION_TYPES.LOAD_BOARD,
          payload: {
            lists: state.lists.map((list) =>
              list.id === conflictId ? resolvedItem : list
            ),
          },
        })
      } else {
        // Update the card in the appropriate list
        const list = state.lists.find((l) =>
          l.cards.some((c) => c.id === conflictId)
        )
        if (list) {
          dispatch({
            type: ACTION_TYPES.UPDATE_CARD,
            payload: {
              listId: list.id,
              cardId: conflictId,
              updates: resolvedItem,
            },
          })
        }
      }

      // Remove from conflicts and show next if any
      const remainingConflicts = conflicts.filter((c) => c.id !== conflictId)
      if (remainingConflicts.length > 0) {
        setCurrentConflict(remainingConflicts[0])
      } else {
        setCurrentConflict(null)
        // Update base version after resolving all conflicts
        baseVersionStorage.save(state)
      }
    },
    [state, conflicts]
  )

  // Enhanced sync with conflict resolution
  const performFullSync = useCallback(async () => {
    if (!isOnline || isSyncingRef.current) return

    // Prevent syncing too frequently (min 10 seconds between syncs)
    const now = Date.now()
    if (now - lastSyncTimeRef.current < 10000) {
      return
    }

    isSyncingRef.current = true
    lastSyncTimeRef.current = now

    try {
      // Get current state from storage to avoid dependency on state
      const currentState = storage.load()
      if (!currentState) {
        isSyncingRef.current = false
        return
      }

      const result = await syncWithServer(currentState)
      if (result.merged && result.merged.lists && result.merged.lists.length > 0) {
        // No conflicts - apply merged state (only if it has data)
        dispatch({ type: ACTION_TYPES.LOAD_BOARD, payload: result.merged })
        baseVersionStorage.save(result.merged)
      } else if (result.merged && (!result.merged.lists || result.merged.lists.length === 0)) {
        // Merged state is empty - don't overwrite local data
        console.warn('Sync returned empty state, preserving local data')
      }
      // If conflicts exist, they're handled by the conflict dialog
    } catch (error) {
      console.error('Full sync failed:', error)
    } finally {
      isSyncingRef.current = false
    }
  }, [isOnline, syncWithServer])

  // Periodic sync with conflict detection (every 60 seconds)
  useEffect(() => {
    if (!isOnline) return

    const interval = setInterval(() => {
      // Use a stable reference to performFullSync
      const currentState = storage.load()
      if (currentState && currentState.lists && currentState.lists.length > 0 && !isSyncingRef.current) {
        syncWithServer(currentState)
          .then((result) => {
            if (result.merged && result.merged.lists && result.merged.lists.length > 0) {
              dispatch({ type: ACTION_TYPES.LOAD_BOARD, payload: result.merged })
              baseVersionStorage.save(result.merged)
            } else if (result.merged && (!result.merged.lists || result.merged.lists.length === 0)) {
              // Merged state is empty - don't overwrite local data
              console.warn('Periodic sync returned empty state, preserving local data')
            }
          })
          .catch((error) => {
            console.error('Periodic sync failed:', error)
          })
      }
    }, 60000) // 60 seconds

    return () => clearInterval(interval)
  }, [isOnline, syncWithServer])

  // Sync on reconnect (only once when coming online)
  // Use a ref to track if data has been loaded to prevent syncing before initial load
  const dataLoadedRef = useRef(false)
  useEffect(() => {
    // Mark data as loaded after initial load completes
    if (state.lists.length > 0) {
      dataLoadedRef.current = true
    }
  }, [state.lists.length])

  const hasSyncedOnReconnect = useRef(false)
  useEffect(() => {
    // Only sync if data has been loaded and we're online
    if (isOnline && !hasSyncedOnReconnect.current && dataLoadedRef.current) {
      hasSyncedOnReconnect.current = true
      // Delay sync to ensure data is fully loaded
      setTimeout(() => {
        const currentState = storage.load()
        if (currentState && currentState.lists && currentState.lists.length > 0 && !isSyncingRef.current) {
          syncWithServer(currentState)
            .then((result) => {
              if (result.merged && result.merged.lists && result.merged.lists.length > 0) {
                dispatch({ type: ACTION_TYPES.LOAD_BOARD, payload: result.merged })
                baseVersionStorage.save(result.merged)
              } else if (result.merged && (!result.merged.lists || result.merged.lists.length === 0)) {
                // Merged state is empty - don't overwrite local data
                console.warn('Reconnect sync returned empty state, preserving local data')
              }
            })
            .catch((error) => {
              console.error('Reconnect sync failed:', error)
            })
        }
      }, 3000) // 3 second delay to ensure data is loaded
    } else if (!isOnline) {
      hasSyncedOnReconnect.current = false
    }
  }, [isOnline, syncWithServer])

  const value = {
    state,
    error,
    isOnline,
    isSyncing,
    queueLength,
    currentConflict,
    addList,
    renameList,
    archiveList,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    reorderCard,
    rollback,
    clearError: () => setError(null),
    resolveConflict: handleResolveConflict,
    performFullSync,
  }

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
}

BoardProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export default BoardProvider
