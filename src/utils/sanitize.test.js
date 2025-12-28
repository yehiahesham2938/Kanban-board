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
    expect(result.date).toBeInstanceOf(Date)
  })
})

