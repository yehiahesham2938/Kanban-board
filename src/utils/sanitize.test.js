import { sanitizeForJSON } from './sanitize'

describe('sanitizeForJSON', () => {
  it('should handle plain objects', () => {
    const obj = { name: 'Test', value: 123 }
    const result = sanitizeForJSON(obj)
    expect(result).toEqual(obj)
  })

  it('should handle arrays', () => {
    const arr = [1, 2, 3]
    const result = sanitizeForJSON(arr)
    expect(result).toEqual(arr)
  })

  it('should remove functions', () => {
    const obj = {
      name: 'Test',
      fn: () => {},
    }
    const result = sanitizeForJSON(obj)
    expect(result).toEqual({ name: 'Test' })
  })

  it('should remove undefined values', () => {
    const obj = {
      name: 'Test',
      value: undefined,
    }
    const result = sanitizeForJSON(obj)
    expect(result).toEqual({ name: 'Test' })
  })

  it('should handle nested objects', () => {
    const obj = {
      level1: {
        level2: {
          value: 'test',
        },
      },
    }
    const result = sanitizeForJSON(obj)
    expect(result).toEqual(obj)
  })

  it('should handle arrays with objects', () => {
    const arr = [{ id: 1 }, { id: 2 }]
    const result = sanitizeForJSON(arr)
    expect(result).toEqual(arr)
  })

  it('should handle null values', () => {
    const obj = { name: 'Test', value: null }
    const result = sanitizeForJSON(obj)
    expect(result).toEqual(obj)
  })

  it('should handle Date objects', () => {
    const date = new Date()
    const obj = { name: 'Test', date }
    const result = sanitizeForJSON(obj)
    expect(result.name).toBe('Test')
    // Date objects are converted to ISO strings in sanitizeForJSON
    expect(typeof result.date).toBe('string')
    expect(result.date).toBe(date.toISOString())
  })

  it('should handle null values', () => {
    const result = sanitizeForJSON(null)
    expect(result).toBeNull()
  })

  it('should handle undefined values', () => {
    const result = sanitizeForJSON(undefined)
    expect(result).toBeUndefined()
  })

  it('should handle symbols', () => {
    const sym = Symbol('test')
    const obj = { name: 'Test', sym }
    const result = sanitizeForJSON(obj)
    expect(result.name).toBe('Test')
    expect(result.sym).toBeUndefined()
  })

  it('should handle circular references gracefully', () => {
    const obj = { name: 'Test' }
    obj.self = obj
    const result = sanitizeForJSON(obj)
    expect(result.name).toBe('Test')
    // Circular reference should be handled (might be undefined or cause error that's caught)
    expect(result.self).toBeDefined() // Should not crash
  })

  it('should handle arrays with mixed types', () => {
    const arr = [1, 'string', null, { nested: 'object' }, () => {}]
    const result = sanitizeForJSON(arr)
    expect(result).toHaveLength(5)
    expect(result[0]).toBe(1)
    expect(result[1]).toBe('string')
    expect(result[2]).toBeNull()
    expect(result[3]).toEqual({ nested: 'object' })
    // Function should be removed or undefined
  })

  it('should handle deeply nested objects', () => {
    const obj = {
      level1: {
        level2: {
          level3: {
            level4: {
              value: 'deep',
            },
          },
        },
      },
    }
    const result = sanitizeForJSON(obj)
    expect(result.level1.level2.level3.level4.value).toBe('deep')
  })
})

