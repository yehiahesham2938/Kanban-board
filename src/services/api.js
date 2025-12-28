// Mock server logic + sync endpoints

import { sanitizeForJSON } from '../utils/sanitize'

const API_BASE_URL = '/api'

// Helper function to handle API responses
async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = response.statusText || 'Request failed'
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorData.message || errorMessage
    } catch {
      // If response is not JSON, use status text
    }
    const error = new Error(errorMessage)
    error.status = response.status
    throw error
  }
  try {
    return await response.json()
  } catch {
    // If response is not JSON, return empty object
    return {}
  }
}

// Helper to handle network errors
async function apiCall(fetchFn) {
  try {
    return await fetchFn()
  } catch (error) {
    // Suppress Chrome extension connection errors (harmless)
    if (error.message && error.message.includes('Could not establish connection')) {
      // This is a Chrome extension error, not a real API error
      // Return a mock success response
      return {}
    }
    
    // Handle "Failed to fetch" errors - these are network errors
    // They will be handled by the offline queue
    if (error.message && error.message.includes('Failed to fetch')) {
      // Check if we're offline
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('You are offline. Changes will be synced when you reconnect.')
      }
      // Otherwise, it's a network error that will be queued
      throw new Error('Network error: Failed to fetch')
    }
    
    // If it's a network error and we're offline, that's expected
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('You are offline. Changes will be synced when you reconnect.')
    }
    
    // Re-throw other errors
    throw error
  }
}

export const api = {
  // Lists endpoints
  createList: async (listData) => {
    return apiCall(async () => {
      const sanitized = sanitizeForJSON(listData)
      const response = await fetch(`${API_BASE_URL}/lists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitized),
      })
      return handleResponse(response)
    })
  },

  updateList: async (listId, updates) => {
    const sanitized = sanitizeForJSON(updates)
    const response = await fetch(`${API_BASE_URL}/lists/${listId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sanitized),
    })
    return handleResponse(response)
  },

  deleteList: async (listId) => {
    const response = await fetch(`${API_BASE_URL}/lists/${listId}`, {
      method: 'DELETE',
    })
    return handleResponse(response)
  },

  // Cards endpoints
  createCard: async (listId, cardData) => {
    const sanitized = sanitizeForJSON(cardData)
    const response = await fetch(`${API_BASE_URL}/lists/${listId}/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sanitized),
    })
    return handleResponse(response)
  },

  updateCard: async (listId, cardId, updates) => {
    const sanitized = sanitizeForJSON(updates)
    const response = await fetch(
      `${API_BASE_URL}/lists/${listId}/cards/${cardId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitized),
      }
    )
    return handleResponse(response)
  },

  deleteCard: async (listId, cardId) => {
    const response = await fetch(
      `${API_BASE_URL}/lists/${listId}/cards/${cardId}`,
      {
        method: 'DELETE',
      }
    )
    return handleResponse(response)
  },

  moveCard: async (cardId, sourceListId, destinationListId, destinationIndex) => {
    const sanitized = sanitizeForJSON({
      sourceListId,
      destinationListId,
      destinationIndex,
    })
    const response = await fetch(`${API_BASE_URL}/cards/${cardId}/move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sanitized),
    })
    return handleResponse(response)
  },

  // Sync endpoint - sync all pending changes
  sync: async (changes) => {
    const sanitized = sanitizeForJSON({ changes })
    const response = await fetch(`${API_BASE_URL}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sanitized),
    })
    return handleResponse(response)
  },

  // Get full board state from server
  getBoardState: async () => {
    const response = await fetch(`${API_BASE_URL}/board`, {
      method: 'GET',
    })
    return handleResponse(response)
  },
}
