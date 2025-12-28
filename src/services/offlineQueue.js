// Offline queue management for syncing changes when online

const QUEUE_KEY = 'kanban-offline-queue'

// Safe JSON stringify that handles circular references
function safeStringify(obj) {
  const seen = new WeakSet()
  return JSON.stringify(obj, (key, value) => {
    // Skip functions, undefined, and symbols
    if (typeof value === 'function' || value === undefined || typeof value === 'symbol') {
      return undefined
    }
    // Skip DOM elements and React components
    if (value && typeof value === 'object') {
      if (value instanceof HTMLElement || value instanceof Element) {
        return undefined
      }
      // Check for circular references
      if (seen.has(value)) {
        return '[Circular]'
      }
      seen.add(value)
    }
    return value
  })
}

// Sanitize operation data to ensure it's JSON-serializable
function sanitizeOperation(operation) {
  return {
    type: String(operation.type || ''),
    data: operation.data
      ? Object.keys(operation.data).reduce((acc, key) => {
          const value = operation.data[key]
          // Only include primitive values and plain objects/arrays
          if (
            value === null ||
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean' ||
            (Array.isArray(value) && value.every((v) => typeof v === 'string')) ||
            (typeof value === 'object' &&
              !(value instanceof HTMLElement) &&
              !(value instanceof Element) &&
              value.constructor === Object)
          ) {
            acc[key] = value
          }
          return acc
        }, {})
      : {},
  }
}

export const offlineQueue = {
  // Add an operation to the queue
  enqueue: (operation) => {
    try {
      const queue = offlineQueue.getAll()
      const sanitized = sanitizeOperation(operation)
      queue.push({
        ...sanitized,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        retries: 0,
      })
      localStorage.setItem(QUEUE_KEY, safeStringify(queue))
      return true
    } catch (error) {
      console.error('Failed to enqueue operation:', error)
      return false
    }
  },

  // Get all queued operations
  getAll: () => {
    try {
      const data = localStorage.getItem(QUEUE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Failed to get queue:', error)
      return []
    }
  },

  // Remove an operation from the queue
  dequeue: (operationId) => {
    try {
      const queue = offlineQueue.getAll()
      const filtered = queue.filter((op) => op.id !== operationId)
      localStorage.setItem(QUEUE_KEY, safeStringify(filtered))
      return true
    } catch (error) {
      console.error('Failed to dequeue operation:', error)
      return false
    }
  },

  // Clear the entire queue
  clear: () => {
    try {
      localStorage.removeItem(QUEUE_KEY)
      return true
    } catch (error) {
      console.error('Failed to clear queue:', error)
      return false
    }
  },

  // Increment retry count for an operation
  incrementRetry: (operationId) => {
    try {
      const queue = offlineQueue.getAll()
      const updated = queue.map((op) =>
        op.id === operationId ? { ...op, retries: (op.retries || 0) + 1 } : op
      )
      localStorage.setItem(QUEUE_KEY, safeStringify(updated))
      return true
    } catch (error) {
      console.error('Failed to increment retry:', error)
      return false
    }
  },
}

