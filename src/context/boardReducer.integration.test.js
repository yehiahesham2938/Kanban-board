import { boardReducer, ACTION_TYPES } from './boardReducer'

/**
 * Integration tests for boardReducer
 * Tests complex workflows and state transitions
 */
describe('boardReducer Integration Tests', () => {
  const initialState = { lists: [] }

  it('should handle complete workflow: create list, add cards, move card, delete card', () => {
    let state = initialState

    // 1. Create a list
    state = boardReducer(state, {
      type: ACTION_TYPES.ADD_LIST,
      payload: {
        id: 'list-1',
        title: 'To Do',
        cards: [],
        archived: false,
      },
    })
    expect(state.lists).toHaveLength(1)
    expect(state.lists[0].title).toBe('To Do')

    // 2. Add cards to the list
    state = boardReducer(state, {
      type: ACTION_TYPES.ADD_CARD,
      payload: {
        listId: 'list-1',
        card: {
          id: 'card-1',
          title: 'Task 1',
          description: 'First task',
          tags: ['urgent'],
        },
      },
    })
    state = boardReducer(state, {
      type: ACTION_TYPES.ADD_CARD,
      payload: {
        listId: 'list-1',
        card: {
          id: 'card-2',
          title: 'Task 2',
          description: 'Second task',
          tags: [],
        },
      },
    })
    expect(state.lists[0].cards).toHaveLength(2)

    // 3. Create another list
    state = boardReducer(state, {
      type: ACTION_TYPES.ADD_LIST,
      payload: {
        id: 'list-2',
        title: 'Done',
        cards: [],
        archived: false,
      },
    })
    expect(state.lists).toHaveLength(2)

    // 4. Move card from list-1 to list-2
    state = boardReducer(state, {
      type: ACTION_TYPES.MOVE_CARD,
      payload: {
        cardId: 'card-1',
        sourceListId: 'list-1',
        destinationListId: 'list-2',
        destinationIndex: 0,
      },
    })
    expect(state.lists[0].cards).toHaveLength(1)
    expect(state.lists[1].cards).toHaveLength(1)
    expect(state.lists[1].cards[0].id).toBe('card-1')

    // 5. Update the moved card
    state = boardReducer(state, {
      type: ACTION_TYPES.UPDATE_CARD,
      payload: {
        listId: 'list-2',
        cardId: 'card-1',
        updates: { description: 'Updated description' },
      },
    })
    expect(state.lists[1].cards[0].description).toBe('Updated description')

    // 6. Delete a card
    state = boardReducer(state, {
      type: ACTION_TYPES.DELETE_CARD,
      payload: {
        listId: 'list-1',
        cardId: 'card-2',
      },
    })
    expect(state.lists[0].cards).toHaveLength(0)

    // 7. Rename list
    state = boardReducer(state, {
      type: ACTION_TYPES.RENAME_LIST,
      payload: {
        listId: 'list-1',
        newTitle: 'In Progress',
      },
    })
    expect(state.lists[0].title).toBe('In Progress')

    // 8. Archive list
    state = boardReducer(state, {
      type: ACTION_TYPES.ARCHIVE_LIST,
      payload: { listId: 'list-1' },
    })
    expect(state.lists[0].archived).toBe(true)
  })

  it('should maintain data integrity during multiple operations', () => {
    let state = initialState

    // Create multiple lists with cards
    for (let i = 0; i < 3; i++) {
      state = boardReducer(state, {
        type: ACTION_TYPES.ADD_LIST,
        payload: {
          id: `list-${i}`,
          title: `List ${i}`,
          cards: [],
          archived: false,
        },
      })

      for (let j = 0; j < 2; j++) {
        state = boardReducer(state, {
          type: ACTION_TYPES.ADD_CARD,
          payload: {
            listId: `list-${i}`,
            card: {
              id: `card-${i}-${j}`,
              title: `Card ${i}-${j}`,
              description: '',
              tags: [],
            },
          },
        })
      }
    }

    // Verify all lists and cards exist
    expect(state.lists).toHaveLength(3)
    state.lists.forEach((list) => {
      expect(list.cards).toHaveLength(2)
    })

    // Reorder cards in first list
    state = boardReducer(state, {
      type: ACTION_TYPES.REORDER_CARD,
      payload: {
        listId: 'list-0',
        cardId: 'card-0-0',
        destinationIndex: 1,
      },
    })

    // Verify reordering worked
    expect(state.lists[0].cards[1].id).toBe('card-0-0')
    expect(state.lists[0].cards[0].id).toBe('card-0-1')

    // Verify other lists unchanged
    expect(state.lists[1].cards).toHaveLength(2)
    expect(state.lists[2].cards).toHaveLength(2)
  })

  it('should handle version tracking across operations', () => {
    let state = initialState

    // Create list
    state = boardReducer(state, {
      type: ACTION_TYPES.ADD_LIST,
      payload: {
        id: 'list-1',
        title: 'Test List',
        cards: [],
        archived: false,
      },
    })

    const initialVersion = state.lists[0].version
    const initialModified = state.lists[0].lastModifiedAt

    // Add a small delay to ensure timestamp difference
    jest.useFakeTimers()
    jest.advanceTimersByTime(1)

    // Rename list (should increment version)
    state = boardReducer(state, {
      type: ACTION_TYPES.RENAME_LIST,
      payload: {
        listId: 'list-1',
        newTitle: 'Renamed List',
      },
    })

    jest.useRealTimers()

    expect(state.lists[0].version).toBeGreaterThan(initialVersion)
    expect(state.lists[0].lastModifiedAt).not.toBe(initialModified)

    // Add card (should increment list version)
    const listVersionBeforeCard = state.lists[0].version
    state = boardReducer(state, {
      type: ACTION_TYPES.ADD_CARD,
      payload: {
        listId: 'list-1',
        card: {
          id: 'card-1',
          title: 'New Card',
          description: '',
          tags: [],
        },
      },
    })

    expect(state.lists[0].version).toBeGreaterThan(listVersionBeforeCard)
    expect(state.lists[0].cards[0].version).toBe(1)
  })
})

