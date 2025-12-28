import { useEffect, useState, useCallback } from 'react'
import { offlineQueue } from '../services/offlineQueue'
import { api } from '../services/api'

export function useOfflineSync(onSyncError) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState(null)

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setSyncError(null)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Sync queued operations when coming online
  const syncQueue = useCallback(async () => {
    if (!isOnline || isSyncing) return

    const queue = offlineQueue.getAll()
    if (queue.length === 0) return

    setIsSyncing(true)
    setSyncError(null)

    try {
      // Process each operation in the queue
      for (const operation of queue) {
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
          }

          // Remove successfully synced operation
          offlineQueue.dequeue(operation.id)
        } catch (error) {
          console.error('Failed to sync operation:', operation, error)
          offlineQueue.incrementRetry(operation.id)

          // If operation has been retried too many times, remove it
          if (operation.retries >= 3) {
            offlineQueue.dequeue(operation.id)
            if (onSyncError) {
              onSyncError(operation, error)
            }
          }
        }
      }

      // If there are still items in queue, sync them
      const remainingQueue = offlineQueue.getAll()
      if (remainingQueue.length > 0) {
        // Retry after a delay
        setTimeout(() => syncQueue(), 5000)
      }
    } catch (error) {
      console.error('Sync failed:', error)
      setSyncError(error.message)
    } finally {
      setIsSyncing(false)
    }
  }, [isOnline, isSyncing, onSyncError])

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline) {
      syncQueue()
    }
  }, [isOnline, syncQueue])

  // Periodic sync check (every 30 seconds when online)
  useEffect(() => {
    if (!isOnline) return

    const interval = setInterval(() => {
      syncQueue()
    }, 30000)

    return () => clearInterval(interval)
  }, [isOnline, syncQueue])

  return {
    isOnline,
    isSyncing,
    syncError,
    syncQueue,
    queueLength: offlineQueue.getAll().length,
  }
}
