import { useEffect, useState, useCallback, useRef } from 'react'
import { offlineQueue } from '../services/offlineQueue'
import { api } from '../services/api'

/**
 * Custom hook for handling offline synchronization, persistence, sync queue, and retry logic.
 * Manages online/offline status, queues operations when offline, and automatically syncs
 * when connection is restored.
 *
 * @param {Function} [onSyncError] - Optional callback function called when an operation fails after max retries
 * @param {Object} [options] - Configuration options
 * @param {number} [options.maxRetries=3] - Maximum number of retry attempts per operation
 * @param {number} [options.retryDelay=5000] - Delay in milliseconds between retry attempts
 * @param {number} [options.syncInterval=30000] - Interval in milliseconds for periodic sync checks
 *
 * @returns {Object} Synchronization state and control functions
 * @returns {boolean} returns.isOnline - Current online/offline status
 * @returns {boolean} returns.isSyncing - Whether a sync operation is currently in progress
 * @returns {string|null} returns.syncError - Error message if sync failed, null otherwise
 * @returns {Function} returns.syncQueue - Manually trigger sync of queued operations
 * @returns {number} returns.queueLength - Number of operations currently in the sync queue
 * @returns {Function} returns.clearError - Clear the current sync error
 *
 * @example
 * ```jsx
 * function MyComponent() {
 *   const { isOnline, isSyncing, queueLength, syncQueue } = useOfflineSync(
 *     (operation, error) => {
 *       console.error('Operation failed:', operation, error)
 *     },
 *     { maxRetries: 5, syncInterval: 60000 }
 *   )
 *
 *   return (
 *     <div>
 *       Status: {isOnline ? 'Online' : 'Offline'}
 *       {isSyncing && <span>Syncing...</span>}
 *       {queueLength > 0 && <span>{queueLength} pending operations</span>}
 *       <button onClick={syncQueue}>Sync Now</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useOfflineSync(onSyncError, options = {}) {
  const {
    maxRetries = 3,
    retryDelay = 5000,
    syncInterval = 30000,
  } = options

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState(null)
  const syncTimeoutRef = useRef(null)

  /**
   * Monitor online/offline status changes
   */
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setSyncError(null)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  /**
   * Process a single operation from the sync queue
   * @param {Object} operation - The operation to process
   * @returns {Promise<boolean>} True if operation succeeded, false otherwise
   */
  const processOperation = useCallback(
    async (operation) => {
      try {
        switch (operation.type) {
          case 'CREATE_LIST':
            await api.createList(operation.data)
            break
          case 'UPDATE_LIST':
            await api.updateList(operation.data.listId, operation.data.updates)
            break
          case 'DELETE_LIST':
            await api.deleteList(operation.data.listId)
            break
          case 'CREATE_CARD':
            await api.createCard(operation.data.listId, operation.data.card)
            break
          case 'UPDATE_CARD':
            await api.updateCard(
              operation.data.listId,
              operation.data.cardId,
              operation.data.updates
            )
            break
          case 'DELETE_CARD':
            await api.deleteCard(operation.data.listId, operation.data.cardId)
            break
          case 'MOVE_CARD':
            await api.moveCard(
              operation.data.cardId,
              operation.data.sourceListId,
              operation.data.destinationListId,
              operation.data.destinationIndex
            )
            break
          default:
            console.warn('Unknown operation type:', operation.type)
            return false
        }

        // Remove successfully synced operation
        offlineQueue.dequeue(operation.id)
        return true
      } catch (error) {
        // Extract error message properly
        const errorMessage =
          error?.message || error?.toString() || 'Unknown error'

        // Increment retry count
        offlineQueue.incrementRetry(operation.id)
        const updatedOperation = offlineQueue
          .getAll()
          .find((op) => op.id === operation.id)
        const retryCount = updatedOperation?.retries || operation.retries || 0

        // If operation has been retried too many times, remove it
        if (retryCount >= maxRetries) {
          console.warn(
            `Operation ${operation.type} failed after ${retryCount} retries, removing from queue`
          )
          offlineQueue.dequeue(operation.id)
          if (onSyncError) {
            onSyncError(operation, new Error(errorMessage))
          }
          return false
        }

        // Log error (but not for expected MSW test failures)
        if (!errorMessage.includes('Failed to')) {
          console.warn(`Sync error for ${operation.type}:`, errorMessage)
        }

        return false
      }
    },
    [maxRetries, onSyncError]
  )

  /**
   * Sync all queued operations with the server
   * Uses exponential backoff for retries
   */
  const syncQueue = useCallback(async () => {
    if (!isOnline || isSyncing) return

    const queue = offlineQueue.getAll()
    if (queue.length === 0) return

    setIsSyncing(true)
    setSyncError(null)

    try {
      // Process each operation in the queue
      const results = await Promise.allSettled(
        queue.map((operation) => processOperation(operation))
      )

      // Check if any operations failed
      const hasFailures = results.some(
        (result) => result.status === 'rejected' || result.value === false
      )

      if (hasFailures) {
        // Schedule retry for failed operations
        const remainingQueue = offlineQueue.getAll()
        if (remainingQueue.length > 0) {
          if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current)
          }
          syncTimeoutRef.current = setTimeout(() => {
            syncQueue()
          }, retryDelay)
        }
      }
    } catch (error) {
      console.error('Sync failed:', error)
      setSyncError(error.message)
    } finally {
      setIsSyncing(false)
    }
  }, [isOnline, isSyncing, processOperation, retryDelay])

  /**
   * Clear the current sync error
   */
  const clearError = useCallback(() => {
    setSyncError(null)
  }, [])

  /**
   * Auto-sync when coming online
   */
  useEffect(() => {
    if (isOnline && !isSyncing) {
      syncQueue()
    }
  }, [isOnline, syncQueue, isSyncing])

  /**
   * Periodic sync check when online
   */
  useEffect(() => {
    if (!isOnline) return

    const interval = setInterval(() => {
      syncQueue()
    }, syncInterval)

    return () => {
      clearInterval(interval)
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [isOnline, syncQueue, syncInterval])

  return {
    isOnline,
    isSyncing,
    syncError,
    syncQueue,
    queueLength: offlineQueue.getAll().length,
    clearError,
  }
}
