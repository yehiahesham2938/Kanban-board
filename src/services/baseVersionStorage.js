// Storage for base versions (last synced state) for three-way merge

const BASE_VERSION_KEY = 'kanban-base-version'

export const baseVersionStorage = {
  save: (data) => {
    try {
      const sanitized = {
        lists: (data.lists || []).map((list) => ({
          id: String(list.id || ''),
          title: String(list.title || ''),
          version: Number(list.version || 1),
          lastModifiedAt: String(list.lastModifiedAt || ''),
          cards: (list.cards || []).map((card) => ({
            id: String(card.id || ''),
            title: String(card.title || ''),
            version: Number(card.version || 1),
            lastModifiedAt: String(card.lastModifiedAt || ''),
          })),
        })),
      }
      localStorage.setItem(BASE_VERSION_KEY, JSON.stringify(sanitized))
      return true
    } catch (error) {
      console.error('Failed to save base version:', error)
      return false
    }
  },

  load: () => {
    try {
      const data = localStorage.getItem(BASE_VERSION_KEY)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Failed to load base version:', error)
      return null
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(BASE_VERSION_KEY)
      return true
    } catch (error) {
      console.error('Failed to clear base version:', error)
      return false
    }
  },
}

