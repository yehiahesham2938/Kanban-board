import { helpers } from './helpers'

describe('helpers', () => {
  describe('generateId', () => {
    it('should generate a UUID v4', () => {
      const id = helpers.generateId()
      expect(id).toBeDefined()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })

    it('should generate unique IDs', () => {
      const id1 = helpers.generateId()
      const id2 = helpers.generateId()
      expect(id1).not.toBe(id2)
    })
  })

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should delay function execution', () => {
      const func = jest.fn()
      const debounced = helpers.debounce(func, 100)

      debounced()
      expect(func).not.toHaveBeenCalled()

      jest.advanceTimersByTime(100)
      expect(func).toHaveBeenCalledTimes(1)
    })

    it('should cancel previous calls', () => {
      const func = jest.fn()
      const debounced = helpers.debounce(func, 100)

      debounced()
      debounced()
      debounced()

      jest.advanceTimersByTime(100)
      expect(func).toHaveBeenCalledTimes(1)
    })

    it('should pass arguments to debounced function', () => {
      const func = jest.fn()
      const debounced = helpers.debounce(func, 100)

      debounced('arg1', 'arg2')
      jest.advanceTimersByTime(100)

      expect(func).toHaveBeenCalledWith('arg1', 'arg2')
    })
  })
})

