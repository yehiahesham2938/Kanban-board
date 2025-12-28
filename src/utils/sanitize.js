// Utility to sanitize data for JSON serialization

export function sanitizeForJSON(obj) {
  if (obj === null || obj === undefined) {
    return obj
  }

  // Handle primitives
  if (typeof obj !== 'object') {
    return obj
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForJSON(item))
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return obj.toISOString()
  }

  // Skip DOM elements and React components
  if (obj instanceof HTMLElement || obj instanceof Element) {
    return undefined
  }

  // Handle plain objects
  const sanitized = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key]
      
      // Skip functions, symbols, and undefined
      if (typeof value === 'function' || typeof value === 'symbol' || value === undefined) {
        continue
      }

      // Skip DOM elements
      if (value instanceof HTMLElement || value instanceof Element) {
        continue
      }

      // Recursively sanitize nested objects
      try {
        sanitized[key] = sanitizeForJSON(value)
      } catch (error) {
        // Skip properties that can't be sanitized
        continue
      }
    }
  }
  return sanitized
}

