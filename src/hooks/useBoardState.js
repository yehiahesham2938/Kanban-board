import { useCallback } from 'react'
import { useBoardContext } from '../context/BoardProvider'
import { ACTION_TYPES } from '../context/boardReducer'

/**
 * Custom hook that wraps board reducer actions for easier use.
 * Provides a simplified API for common board operations.
 *
 * @returns {Object} An object containing board state and action functions
 * @returns {Object} returns.state - Current board state
 * @returns {Function} returns.addList - Add a new list to the board
 * @returns {Function} returns.renameList - Rename an existing list
 * @returns {Function} returns.archiveList - Archive a list
 * @returns {Function} returns.addCard - Add a card to a list
 * @returns {Function} returns.updateCard - Update a card's properties
 * @returns {Function} returns.deleteCard - Delete a card from a list
 * @returns {Function} returns.moveCard - Move a card between lists
 * @returns {Function} returns.reorderCard - Reorder a card within the same list
 * @returns {Function} returns.getList - Get a list by ID
 * @returns {Function} returns.getCard - Get a card by ID
 * @returns {Array} returns.activeLists - Get all non-archived lists
 * @returns {Function} returns.clearError - Clear any error state
 *
 * @example
 * ```jsx
 * function MyComponent() {
 *   const {
 *     state,
 *     addList,
 *     addCard,
 *     activeLists
 *   } = useBoardState()
 *
 *   const handleAddList = () => {
 *     addList('My New List')
 *   }
 *
 *   return (
 *     <div>
 *       {activeLists.map(list => (
 *         <div key={list.id}>{list.title}</div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useBoardState() {
  const {
    state,
    addList,
    renameList,
    archiveList,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    reorderCard,
    error,
    clearError,
  } = useBoardContext()

  /**
   * Get a list by its ID
   * @param {string} listId - The ID of the list to retrieve
   * @returns {Object|undefined} The list object or undefined if not found
   */
  const getList = useCallback(
    (listId) => {
      return state.lists.find((list) => list.id === listId)
    },
    [state.lists]
  )

  /**
   * Get a card by its ID (searches across all lists)
   * @param {string} cardId - The ID of the card to retrieve
   * @returns {Object|undefined} The card object with its listId, or undefined if not found
   */
  const getCard = useCallback(
    (cardId) => {
      for (const list of state.lists) {
        const card = list.cards.find((c) => c.id === cardId)
        if (card) {
          return { ...card, listId: list.id }
        }
      }
      return undefined
    },
    [state.lists]
  )

  /**
   * Get all active (non-archived) lists
   * @returns {Array} Array of active list objects
   */
  const activeLists = state.lists.filter((list) => !list.archived)

  return {
    state,
    addList,
    renameList,
    archiveList,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    reorderCard,
    getList,
    getCard,
    activeLists,
    error,
    clearError,
  }
}
