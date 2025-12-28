// IndexedDB or localStorage handlers

const STORAGE_KEY = 'kanban-board-data'

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

export const storage = {
  save: (data) => {
    try {
      // Sanitize data before saving - only save plain objects/arrays
      const sanitized = {
        lists: (data.lists || []).map((list) => ({
          id: String(list.id || ''),
          title: String(list.title || ''),
          version: Number(list.version || 1),
          lastModifiedAt: String(list.lastModifiedAt || list.createdAt || ''),
          cards: (list.cards || []).map((card) => ({
            id: String(card.id || ''),
            title: String(card.title || ''),
            description: String(card.description || ''),
            tags: Array.isArray(card.tags) ? card.tags.map(String) : [],
            version: Number(card.version || 1),
            lastModifiedAt: String(card.lastModifiedAt || card.updatedAt || ''),
            createdAt: String(card.createdAt || ''),
            updatedAt: String(card.updatedAt || ''),
          })),
          archived: Boolean(list.archived),
          createdAt: String(list.createdAt || ''),
        })),
      }
      localStorage.setItem(STORAGE_KEY, safeStringify(sanitized))
      return true
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
      return false
    }
  },

  load: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
      return null
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      return true
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
      return false
    }
  },
}
