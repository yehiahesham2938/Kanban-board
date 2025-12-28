import { threeWayMerge, mergeLists, mergeCards } from './merge'

describe('merge utilities', () => {
  describe('threeWayMerge', () => {
    it('should use server version when server is newer and local unchanged', () => {
      const base = { id: '1', version: 1, title: 'Base' }
      const local = { id: '1', version: 1, title: 'Base' }
      const server = { id: '1', version: 2, title: 'Server Updated' }

      const result = threeWayMerge(base, local, server)
      expect(result.resolved).toEqual(server)
      expect(result.strategy).toBe('server')
    })

    it('should use local version when local is newer and server unchanged', () => {
      const base = { id: '1', version: 1, title: 'Base' }
      const local = { id: '1', version: 2, title: 'Local Updated' }
      const server = { id: '1', version: 1, title: 'Base' }

      const result = threeWayMerge(base, local, server)
      expect(result.resolved).toEqual(local)
      expect(result.strategy).toBe('local')
    })

    it('should detect conflict when both changed', () => {
      const base = { id: '1', version: 1, title: 'Base' }
      const local = { id: '1', version: 2, title: 'Local Updated' }
      const server = { id: '1', version: 2, title: 'Server Updated' }

      const result = threeWayMerge(base, local, server)
      expect(result.resolved).toBeNull()
      expect(result.strategy).toBe('conflict')
    })

    it('should prefer server when versions are equal', () => {
      const base = { id: '1', version: 1, title: 'Base' }
      const local = { id: '1', version: 1, title: 'Local' }
      const server = { id: '1', version: 1, title: 'Server' }

      const result = threeWayMerge(base, local, server)
      expect(result.resolved).toEqual(server)
      expect(result.strategy).toBe('server')
    })
  })

  describe('mergeLists', () => {
    it('should merge lists without conflicts', () => {
      const base = [{ id: '1', title: 'List 1', version: 1 }]
      const local = [{ id: '1', title: 'List 1 Updated', version: 2 }]
      const server = [{ id: '1', title: 'List 1', version: 1 }]

      const result = mergeLists(base, local, server)
      expect(result.merged).toHaveLength(1)
      expect(result.conflicts).toHaveLength(0)
    })

    it('should detect conflicts in lists', () => {
      const base = [{ id: '1', title: 'List 1', version: 1 }]
      const local = [{ id: '1', title: 'List 1 Local', version: 2 }]
      const server = [{ id: '1', title: 'List 1 Server', version: 2 }]

      const result = mergeLists(base, local, server)
      expect(result.conflicts.length).toBeGreaterThan(0)
    })

    it('should handle lists added locally', () => {
      const base = []
      const local = [{ id: '1', title: 'New List', version: 1 }]
      const server = []

      const result = mergeLists(base, local, server)
      expect(result.merged).toHaveLength(1)
      expect(result.merged[0].id).toBe('1')
    })

    it('should handle lists deleted locally', () => {
      const base = [{ id: '1', title: 'List 1', version: 1 }]
      const local = []
      const server = [{ id: '1', title: 'List 1', version: 1 }]

      const result = mergeLists(base, local, server)
      // Should keep server version (undelete)
      expect(result.merged).toHaveLength(1)
    })
  })

  describe('mergeCards', () => {
    it('should merge cards without conflicts', () => {
      const base = [{ id: '1', title: 'Card 1', version: 1 }]
      const local = [{ id: '1', title: 'Card 1 Updated', version: 2 }]
      const server = [{ id: '1', title: 'Card 1', version: 1 }]

      const result = mergeCards(base, local, server)
      expect(result.merged).toHaveLength(1)
      expect(result.conflicts).toHaveLength(0)
    })

    it('should detect conflicts in cards', () => {
      const base = [{ id: '1', title: 'Card 1', version: 1 }]
      const local = [{ id: '1', title: 'Card 1 Local', version: 2 }]
      const server = [{ id: '1', title: 'Card 1 Server', version: 2 }]

      const result = mergeCards(base, local, server)
      expect(result.conflicts.length).toBeGreaterThan(0)
    })

    it('should handle cards added locally', () => {
      const base = []
      const local = [{ id: '1', title: 'New Card', version: 1 }]
      const server = []

      const result = mergeCards(base, local, server)
      expect(result.merged).toHaveLength(1)
      expect(result.merged[0].id).toBe('1')
    })

    it('should handle cards deleted locally', () => {
      const base = [{ id: '1', title: 'Card 1', version: 1 }]
      const local = []
      const server = [{ id: '1', title: 'Card 1', version: 1 }]

      const result = mergeCards(base, local, server)
      // Should keep server version (undelete)
      expect(result.merged).toHaveLength(1)
      expect(result.merged[0].id).toBe('1')
    })

    it('should handle cards deleted on server', () => {
      const base = [{ id: '1', title: 'Card 1', version: 1 }]
      const local = [{ id: '1', title: 'Card 1', version: 1 }]
      const server = []

      const result = mergeCards(base, local, server)
      // Should not include deleted card
      expect(result.merged).toHaveLength(0)
    })

    it('should handle cards added on server', () => {
      const base = []
      const local = []
      const server = [{ id: '1', title: 'New Card', version: 1 }]

      const result = mergeCards(base, local, server)
      expect(result.merged).toHaveLength(1)
      expect(result.merged[0].id).toBe('1')
    })

    it('should handle cards added in both local and server', () => {
      const base = []
      const local = [{ id: '1', title: 'Local Card', version: 1 }]
      const server = [{ id: '2', title: 'Server Card', version: 1 }]

      const result = mergeCards(base, local, server)
      // Should prefer server when both added
      expect(result.merged.length).toBeGreaterThan(0)
    })
  })

  describe('mergeLists edge cases', () => {
    it('should handle lists deleted on server', () => {
      const base = [{ id: '1', title: 'List 1', version: 1 }]
      const local = [{ id: '1', title: 'List 1', version: 1 }]
      const server = []

      const result = mergeLists(base, local, server)
      // Should keep local (was deleted on server)
      expect(result.merged).toHaveLength(0)
    })

    it('should handle lists added in both local and server', () => {
      const base = []
      const local = [{ id: '1', title: 'Local List', version: 1 }]
      const server = [{ id: '2', title: 'Server List', version: 1 }]

      const result = mergeLists(base, local, server)
      // Should prefer server when both added
      expect(result.merged.length).toBeGreaterThan(0)
    })
  })
})

