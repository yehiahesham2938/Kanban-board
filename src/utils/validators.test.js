import { validators } from './validators'

describe('validators', () => {
  describe('isNotEmpty', () => {
    it('should return true for non-empty string', () => {
      expect(validators.isNotEmpty('test')).toBe(true)
    })

    it('should return false for empty string', () => {
      expect(validators.isNotEmpty('')).toBe(false)
    })

    it('should return false for whitespace-only string', () => {
      expect(validators.isNotEmpty('   ')).toBe(false)
    })

    it('should return false for null', () => {
      expect(validators.isNotEmpty(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(validators.isNotEmpty(undefined)).toBe(false)
    })

    it('should return true for number', () => {
      expect(validators.isNotEmpty(0)).toBe(true)
      expect(validators.isNotEmpty(123)).toBe(true)
    })
  })

  describe('isValidId', () => {
    it('should return true for valid string ID', () => {
      expect(validators.isValidId('id-123')).toBe(true)
    })

    it('should return false for empty string', () => {
      expect(validators.isValidId('')).toBe(false)
    })

    it('should return false for null', () => {
      expect(validators.isValidId(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(validators.isValidId(undefined)).toBe(false)
    })

    it('should return false for number', () => {
      expect(validators.isValidId(123)).toBe(false)
    })
  })

  describe('isValidList', () => {
    it('should return true for valid list', () => {
      const list = {
        id: 'list-1',
        title: 'Test List',
      }
      expect(validators.isValidList(list)).toBe(true)
    })

    it('should return false for missing id', () => {
      const list = {
        title: 'Test List',
      }
      expect(validators.isValidList(list)).toBe(false)
    })

    it('should return false for missing title', () => {
      const list = {
        id: 'list-1',
      }
      expect(validators.isValidList(list)).toBe(false)
    })

    it('should return false for null', () => {
      expect(validators.isValidList(null)).toBe(false)
    })

    it('should return false for empty title', () => {
      const list = {
        id: 'list-1',
        title: '',
      }
      expect(validators.isValidList(list)).toBe(false)
    })
  })

  describe('isValidCard', () => {
    it('should return true for valid card', () => {
      const card = {
        id: 'card-1',
        title: 'Test Card',
      }
      expect(validators.isValidCard(card)).toBe(true)
    })

    it('should return false for missing id', () => {
      const card = {
        title: 'Test Card',
      }
      expect(validators.isValidCard(card)).toBe(false)
    })

    it('should return false for missing title', () => {
      const card = {
        id: 'card-1',
      }
      expect(validators.isValidCard(card)).toBe(false)
    })

    it('should return false for null', () => {
      expect(validators.isValidCard(null)).toBe(false)
    })

    it('should return false for empty title', () => {
      const card = {
        id: 'card-1',
        title: '',
      }
      expect(validators.isValidCard(card)).toBe(false)
    })
  })
})

