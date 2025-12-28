import { renderHook, act } from '@testing-library/react'
import { useUndoRedo } from './useUndoRedo'

describe('useUndoRedo', () => {
  const initialState = { lists: [] }

  it('should return undo/redo functions and state', () => {
    const { result } = renderHook(() => useUndoRedo(initialState))

    expect(result.current).toHaveProperty('undo')
    expect(result.current).toHaveProperty('redo')
    expect(result.current).toHaveProperty('addToHistory')
    expect(result.current).toHaveProperty('clearHistory')
    expect(result.current).toHaveProperty('canUndo')
    expect(result.current).toHaveProperty('canRedo')
    expect(result.current).toHaveProperty('historyLength')
    expect(result.current).toHaveProperty('currentIndex')
    expect(result.current).toHaveProperty('currentState')
  })

  it('should initialize with initial state', () => {
    const { result } = renderHook(() => useUndoRedo(initialState))

    expect(result.current.currentState).toEqual(initialState)
    expect(result.current.historyLength).toBe(1)
    expect(result.current.currentIndex).toBe(0)
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })

  it('should add state to history', () => {
    const { result } = renderHook(() => useUndoRedo(initialState))

    const newState = { lists: [{ id: '1', title: 'List 1' }] }

    act(() => {
      result.current.addToHistory(newState)
    })

    expect(result.current.historyLength).toBe(2)
    expect(result.current.currentIndex).toBe(1)
    expect(result.current.currentState).toEqual(newState)
    expect(result.current.canUndo).toBe(true)
    expect(result.current.canRedo).toBe(false)
  })

  it('should undo to previous state', () => {
    const { result } = renderHook(() => useUndoRedo(initialState))

    const state1 = { lists: [{ id: '1', title: 'List 1' }] }
    const state2 = { lists: [{ id: '1', title: 'List 1' }, { id: '2', title: 'List 2' }] }

    act(() => {
      result.current.addToHistory(state1)
      result.current.addToHistory(state2)
    })

    expect(result.current.currentState).toEqual(state2)
    expect(result.current.canUndo).toBe(true)

    act(() => {
      result.current.undo()
    })

    expect(result.current.currentState).toEqual(state1)
    expect(result.current.currentIndex).toBe(1)
    expect(result.current.canUndo).toBe(true)
    expect(result.current.canRedo).toBe(true)
  })

  it('should redo to next state', () => {
    const { result } = renderHook(() => useUndoRedo(initialState))

    const state1 = { lists: [{ id: '1', title: 'List 1' }] }
    const state2 = { lists: [{ id: '1', title: 'List 1' }, { id: '2', title: 'List 2' }] }

    act(() => {
      result.current.addToHistory(state1)
      result.current.addToHistory(state2)
    })

    act(() => {
      result.current.undo()
    })

    expect(result.current.currentState).toEqual(state1)
    expect(result.current.canRedo).toBe(true)

    act(() => {
      result.current.redo()
    })

    expect(result.current.currentState).toEqual(state2)
    expect(result.current.currentIndex).toBe(2)
    expect(result.current.canUndo).toBe(true)
    expect(result.current.canRedo).toBe(false)
  })

  it('should not undo when at beginning of history', () => {
    const { result } = renderHook(() => useUndoRedo(initialState))

    expect(result.current.canUndo).toBe(false)

    act(() => {
      result.current.undo()
    })

    expect(result.current.currentIndex).toBe(0)
    expect(result.current.currentState).toEqual(initialState)
  })

  it('should not redo when at end of history', () => {
    const { result } = renderHook(() => useUndoRedo(initialState))

    const state1 = { lists: [{ id: '1', title: 'List 1' }] }

    act(() => {
      result.current.addToHistory(state1)
    })

    expect(result.current.canRedo).toBe(false)

    act(() => {
      result.current.redo()
    })

    expect(result.current.currentState).toEqual(state1)
    expect(result.current.currentIndex).toBe(1)
  })

  it('should truncate future history when adding new state after undo', () => {
    const { result } = renderHook(() => useUndoRedo(initialState))

    const state1 = { lists: [{ id: '1', title: 'List 1' }] }
    const state2 = { lists: [{ id: '1', title: 'List 1' }, { id: '2', title: 'List 2' }] }
    const state3 = { lists: [{ id: '1', title: 'List 1' }, { id: '2', title: 'List 2' }, { id: '3', title: 'List 3' }] }

    act(() => {
      result.current.addToHistory(state1)
      result.current.addToHistory(state2)
    })

    act(() => {
      result.current.undo()
    })

    expect(result.current.currentState).toEqual(state1)

    act(() => {
      result.current.addToHistory(state3)
    })

    expect(result.current.historyLength).toBe(3)
    expect(result.current.currentState).toEqual(state3)
    expect(result.current.canRedo).toBe(false)
  })

  it('should limit history size', () => {
    const { result } = renderHook(() => useUndoRedo(initialState, 3))

    act(() => {
      result.current.addToHistory({ lists: [{ id: '1' }] })
      result.current.addToHistory({ lists: [{ id: '2' }] })
      result.current.addToHistory({ lists: [{ id: '3' }] })
      result.current.addToHistory({ lists: [{ id: '4' }] })
    })

    expect(result.current.historyLength).toBe(3)
    expect(result.current.currentState.lists[0].id).toBe('2')
  })

  it('should clear history', () => {
    const { result } = renderHook(() => useUndoRedo(initialState))

    const state1 = { lists: [{ id: '1', title: 'List 1' }] }

    act(() => {
      result.current.addToHistory(state1)
    })

    expect(result.current.historyLength).toBe(2)

    act(() => {
      result.current.clearHistory()
    })

    expect(result.current.historyLength).toBe(1)
    expect(result.current.currentState).toEqual(initialState)
    expect(result.current.currentIndex).toBe(0)
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })

  it('should jump to specific history index', () => {
    const { result } = renderHook(() => useUndoRedo(initialState))

    const state1 = { lists: [{ id: '1' }] }
    const state2 = { lists: [{ id: '2' }] }
    const state3 = { lists: [{ id: '3' }] }

    act(() => {
      result.current.addToHistory(state1)
      result.current.addToHistory(state2)
      result.current.addToHistory(state3)
    })

    expect(result.current.currentIndex).toBe(3)

    act(() => {
      result.current.jumpToHistory(1)
    })

    expect(result.current.currentIndex).toBe(1)
    expect(result.current.currentState).toEqual(state1)
  })

  it('should not jump to invalid index', () => {
    const { result } = renderHook(() => useUndoRedo(initialState))

    const state1 = { lists: [{ id: '1' }] }

    act(() => {
      result.current.addToHistory(state1)
    })

    const initialIndex = result.current.currentIndex

    act(() => {
      result.current.jumpToHistory(-1)
      result.current.jumpToHistory(10)
    })

    expect(result.current.currentIndex).toBe(initialIndex)
  })
})

