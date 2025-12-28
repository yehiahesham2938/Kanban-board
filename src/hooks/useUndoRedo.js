import React, { useState, useCallback, useRef, useEffect } from 'react'

/**
 * Custom hook that provides multi-level undo/redo functionality for board operations.
 * Maintains a history stack of board states and allows navigation through them.
 *
 * @param {Object} initialState - Initial state to start the history with
 * @param {number} [maxHistorySize=50] - Maximum number of history entries to keep
 *
 * @returns {Object} Undo/redo state and control functions
 * @returns {Function} returns.undo - Move back one step in history
 * @returns {Function} returns.redo - Move forward one step in history
 * @returns {Function} returns.addToHistory - Add a new state to the history
 * @returns {Function} returns.clearHistory - Clear all history
 * @returns {boolean} returns.canUndo - Whether undo is possible
 * @returns {boolean} returns.canRedo - Whether redo is possible
 * @returns {number} returns.historyLength - Total number of history entries
 * @returns {number} returns.currentIndex - Current position in history
 * @returns {Object} returns.currentState - Current state from history
 *
 * @example
 * ```jsx
 * function MyComponent() {
 *   const [state, setState] = useState(initialState)
 *   const {
 *     undo,
 *     redo,
 *     addToHistory,
 *     canUndo,
 *     canRedo
 *   } = useUndoRedo(initialState, 100)
 *
 *   const handleStateChange = (newState) => {
 *     setState(newState)
 *     addToHistory(newState)
 *   }
 *
 *   return (
 *     <div>
 *       <button onClick={undo} disabled={!canUndo}>Undo</button>
 *       <button onClick={redo} disabled={!canRedo}>Redo</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useUndoRedo(initialState, maxHistorySize = 50) {
  const [history, setHistory] = useState([initialState])
  const [currentIndex, setCurrentIndex] = useState(0)
  const isUndoRedoRef = useRef(false)
  const historyRef = useRef([initialState])
  const currentIndexRef = useRef(0)

  // Keep refs in sync with state
  React.useEffect(() => {
    historyRef.current = history
    currentIndexRef.current = currentIndex
  }, [history, currentIndex])
  

  /**
   * Get the current state from history
   */
  const currentState = history[currentIndex]

  /**
   * Check if undo is possible
   */
  const canUndo = currentIndex > 0

  /**
   * Check if redo is possible
   */
  const canRedo = currentIndex < history.length - 1

  /**
   * Move back one step in history (undo)
   */
  const undo = useCallback(() => {
    if (!canUndo) return

    isUndoRedoRef.current = true
    setCurrentIndex((prev) => {
      const newIndex = prev - 1
      const finalIndex = Math.max(0, newIndex)
      currentIndexRef.current = finalIndex
      return finalIndex
    })
    
    // Reset flag after state update
    setTimeout(() => {
      isUndoRedoRef.current = false
    }, 0)
  }, [canUndo])

  /**
   * Move forward one step in history (redo)
   */
  const redo = useCallback(() => {
    if (!canRedo) return

    isUndoRedoRef.current = true
    setCurrentIndex((prev) => {
      const currentHistory = historyRef.current
      const newIndex = prev + 1
      const finalIndex = Math.min(currentHistory.length - 1, newIndex)
      currentIndexRef.current = finalIndex
      return finalIndex
    })
    
    // Reset flag after state update
    setTimeout(() => {
      isUndoRedoRef.current = false
    }, 0)
  }, [canRedo])

  /**
   * Add a new state to the history
   * If we're not at the end of history, truncate future history
   * @param {Object} newState - The new state to add to history
   */
  const addToHistory = useCallback(
    (newState) => {
      // Don't add to history if this is an undo/redo operation
      if (isUndoRedoRef.current) {
        return
      }

      // Get current values from refs for synchronous access
      const prevHistory = historyRef.current
      const prevIndex = currentIndexRef.current
      
      // Truncate future history and add new state
      const newHistory = [...prevHistory.slice(0, prevIndex + 1), newState]
      
      // Limit history size
      let finalHistory = newHistory
      let finalIndex = newHistory.length - 1
      
      if (newHistory.length > maxHistorySize) {
        // Remove oldest entries from the beginning
        const excess = newHistory.length - maxHistorySize
        finalHistory = newHistory.slice(excess)
        // After truncation, index should point to the last item
        finalIndex = finalHistory.length - 1
      }
      
      // Update refs immediately for synchronous access
      historyRef.current = finalHistory
      currentIndexRef.current = finalIndex
      
      // Update state (useEffect will keep refs in sync, but we've already updated them)
      setHistory(finalHistory)
      setCurrentIndex(finalIndex)
    },
    [maxHistorySize]
  )

  /**
   * Clear all history and reset to initial state
   */
  const clearHistory = useCallback(() => {
    const newHistory = [initialState]
    setHistory(newHistory)
    setCurrentIndex(0)
    historyRef.current = newHistory
    currentIndexRef.current = 0
  }, [initialState])

  /**
   * Jump to a specific index in history
   * @param {number} index - The index to jump to
   */
  const jumpToHistory = useCallback(
    (index) => {
      const currentHistory = historyRef.current
      if (index >= 0 && index < currentHistory.length) {
        isUndoRedoRef.current = true
        setCurrentIndex(index)
        currentIndexRef.current = index
        setTimeout(() => {
          isUndoRedoRef.current = false
        }, 0)
      }
    },
    []
  )

  return {
    undo,
    redo,
    addToHistory,
    clearHistory,
    jumpToHistory,
    canUndo,
    canRedo,
    historyLength: history.length,
    currentIndex,
    currentState,
  }
}
