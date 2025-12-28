// Helper utility functions
import { v4 as uuidv4 } from 'uuid'

export const helpers = {
  generateId: () => uuidv4(),

  debounce: (func, wait) => {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  },
}
