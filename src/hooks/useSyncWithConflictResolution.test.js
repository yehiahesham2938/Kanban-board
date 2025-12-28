import { renderHook, act, waitFor } from '@testing-library/react'
import { useSyncWithConflictResolution } from './useSyncWithConflictResolution'
import { api } from '../services/api'
import { storage } from '../services/storage'
import { baseVersionStorage } from '../services/baseVersionStorage'

jest.mock('../services/api', () => ({
  api: {
    getBoardState: jest.fn(),
  },
}))

jest.mock('../services/storage', () => ({
  storage: {
    load: jest.fn(),
  },
}))

jest.mock('../services/baseVersionStorage', () => ({
  baseVersionStorage: {
    load: jest.fn(),
    save: jest.fn(),
  },
}))

describe('useSyncWithConflictResolution', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return sync functions and state', () => {
    storage.load.mockReturnValue({ lists: [] })
    baseVersionStorage.load.mockReturnValue(null)
    api.getBoardState.mockResolvedValue({ lists: [] })

    const { result } = renderHook(() => useSyncWithConflictResolution())

    expect(result.current).toHaveProperty('syncWithServer')
    expect(result.current).toHaveProperty('resolveConflict')
    expect(result.current).toHaveProperty('conflicts')
    expect(result.current).toHaveProperty('isSyncing')
  })

  it('should sync with server and return merged state', async () => {
    const localData = {
      lists: [{ id: 'list-1', title: 'Local List', version: 2, cards: [] }],
    }
    const serverData = {
      lists: [{ id: 'list-1', title: 'Server List', version: 1, cards: [] }],
    }
    const baseData = {
      lists: [{ id: 'list-1', title: 'Base List', version: 1, cards: [] }],
    }

    storage.load.mockReturnValue(localData)
    baseVersionStorage.load.mockReturnValue(baseData)
    api.getBoardState.mockResolvedValue(serverData)

    const { result } = renderHook(() => useSyncWithConflictResolution())

    let syncResult
    await act(async () => {
      syncResult = await result.current.syncWithServer()
    })

    expect(syncResult.merged).toBeDefined()
    expect(syncResult.conflicts).toHaveLength(0)
  })

  it('should detect conflicts', async () => {
    const localData = {
      lists: [{ id: 'list-1', title: 'Local', version: 2, cards: [] }],
    }
    const serverData = {
      lists: [{ id: 'list-1', title: 'Server', version: 2, cards: [] }],
    }
    const baseData = {
      lists: [{ id: 'list-1', title: 'Base', version: 1, cards: [] }],
    }

    storage.load.mockReturnValue(localData)
    baseVersionStorage.load.mockReturnValue(baseData)
    api.getBoardState.mockResolvedValue(serverData)

    const onConflict = jest.fn()
    const { result } = renderHook(() => useSyncWithConflictResolution(onConflict))

    let syncResult
    await act(async () => {
      syncResult = await result.current.syncWithServer()
    })

    expect(syncResult.conflicts.length).toBeGreaterThan(0)
    expect(onConflict).toHaveBeenCalled()
  })

  it('should handle API errors gracefully', async () => {
    storage.load.mockReturnValue({ lists: [] })
    baseVersionStorage.load.mockReturnValue(null)
    api.getBoardState.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useSyncWithConflictResolution())

    let syncResult
    await act(async () => {
      syncResult = await result.current.syncWithServer()
    })

    // Should use base version when API fails
    expect(syncResult).toBeDefined()
  })

  it('should resolve conflicts', () => {
    const { result } = renderHook(() => useSyncWithConflictResolution())

    act(() => {
      const resolved = result.current.resolveConflict('conflict-1', { id: '1' }, 'list')
      expect(resolved).toEqual({ id: '1' })
    })

    expect(result.current.conflicts).not.toContainEqual(
      expect.objectContaining({ id: 'conflict-1' })
    )
  })
})

