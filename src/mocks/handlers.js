import { http, HttpResponse } from 'msw'

const API_BASE = '/api'

// Helper to check if a request should be handled by MSW
// Only handle API requests, not page loads or static assets
function shouldHandleRequest(url) {
  return url.pathname.startsWith(API_BASE)
}

// Simulate delay
const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms))

// Simulate random failures (1% failure rate for less frequent errors during testing)
const shouldFail = () => Math.random() < 0.01

// In-memory state storage for mock server
// In a real app, this would be a database
let mockServerState = {
  lists: [],
}

// Helper to get state from localStorage if available (for seeded data)
// Note: The app uses 'kanban-board-data' as the storage key
function getInitialState() {
  try {
    // Try the correct storage key first
    let stored = localStorage.getItem('kanban-board-data')
    if (!stored) {
      // Fallback to old key for backwards compatibility
      stored = localStorage.getItem('kanban-board-state')
    }
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed && parsed.lists && Array.isArray(parsed.lists)) {
        return parsed
      }
    }
  } catch (e) {
    // Ignore errors
  }
  return { lists: [] }
}

// Initialize state from localStorage on first load
mockServerState = getInitialState()

export const handlers = [
  // Create list
  http.post(`${API_BASE}/lists`, async ({ request }) => {
    await delay(300)
    if (shouldFail()) {
      return HttpResponse.json(
        { error: 'Failed to create list' },
        { status: 500 }
      )
    }
    const data = await request.json()
    return HttpResponse.json({
      id: data.id || crypto.randomUUID(),
      ...data,
      createdAt: new Date().toISOString(),
    })
  }),

  // Update list
  http.put(`${API_BASE}/lists/:id`, async ({ params, request }) => {
    await delay(200)
    if (shouldFail()) {
      return HttpResponse.json(
        { error: 'Failed to update list' },
        { status: 500 }
      )
    }
    const data = await request.json()
    return HttpResponse.json({
      id: params.id,
      ...data,
      updatedAt: new Date().toISOString(),
    })
  }),

  // Delete list
  http.delete(`${API_BASE}/lists/:id`, async ({ params }) => {
    await delay(200)
    if (shouldFail()) {
      return HttpResponse.json(
        { error: 'Failed to delete list' },
        { status: 500 }
      )
    }
    return HttpResponse.json({ success: true, id: params.id })
  }),

  // Create card
  http.post(`${API_BASE}/lists/:listId/cards`, async ({ params, request }) => {
    await delay(300)
    if (shouldFail()) {
      return HttpResponse.json(
        { error: 'Failed to create card' },
        { status: 500 }
      )
    }
    const data = await request.json()
    return HttpResponse.json({
      id: data.id || crypto.randomUUID(),
      listId: params.listId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }),

  // Update card
  http.put(
    `${API_BASE}/lists/:listId/cards/:cardId`,
    async ({ params, request }) => {
      await delay(200)
      if (shouldFail()) {
        return HttpResponse.json(
          { error: 'Failed to update card' },
          { status: 500 }
        )
      }
      const data = await request.json()
      return HttpResponse.json({
        id: params.cardId,
        listId: params.listId,
        ...data,
        updatedAt: new Date().toISOString(),
      })
    }
  ),

  // Delete card
  http.delete(
    `${API_BASE}/lists/:listId/cards/:cardId`,
    async ({ params }) => {
      await delay(200)
      if (shouldFail()) {
        return HttpResponse.json(
          { error: 'Failed to delete card' },
          { status: 500 }
        )
      }
      return HttpResponse.json({
        success: true,
        id: params.cardId,
        listId: params.listId,
      })
    }
  ),

  // Move card
  http.post(`${API_BASE}/cards/:cardId/move`, async ({ params, request }) => {
    await delay(400)
    if (shouldFail()) {
      return HttpResponse.json(
        { error: 'Failed to move card' },
        { status: 500 }
      )
    }
    const data = await request.json()
    return HttpResponse.json({
      success: true,
      cardId: params.cardId,
      ...data,
    })
  }),

  // Sync endpoint
  http.post(`${API_BASE}/sync`, async ({ request }) => {
    await delay(500)
    if (shouldFail()) {
      return HttpResponse.json(
        { error: 'Failed to sync changes' },
        { status: 500 }
      )
    }
    const data = await request.json()
    return HttpResponse.json({
      success: true,
      synced: data.changes?.length || 0,
      timestamp: new Date().toISOString(),
    })
  }),

  // Get board state
  http.get(`${API_BASE}/board`, async () => {
    await delay(300)
    // Always read from localStorage to get the latest state
    // This ensures the mock server returns the actual current state
    const currentState = getInitialState()
    return HttpResponse.json({
      lists: currentState.lists || [],
    })
  }),
]

