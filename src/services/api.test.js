import { api } from './api'

// Mock fetch
global.fetch = jest.fn()

describe('api service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fetch.mockClear()
  })

  it('should create a list', async () => {
    const mockResponse = { id: 'list-1', title: 'New List' }
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await api.createList({ id: 'list-1', title: 'New List' })
    expect(result).toEqual(mockResponse)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/lists'),
      expect.objectContaining({
        method: 'POST',
      })
    )
  })

  it('should update a list', async () => {
    const mockResponse = { id: 'list-1', title: 'Updated List' }
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await api.updateList('list-1', { title: 'Updated List' })
    expect(result).toEqual(mockResponse)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/lists/list-1'),
      expect.objectContaining({
        method: 'PUT',
      })
    )
  })

  it('should delete a list', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    await api.deleteList('list-1')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/lists/list-1'),
      expect.objectContaining({
        method: 'DELETE',
      })
    )
  })

  it('should create a card', async () => {
    const mockResponse = { id: 'card-1', title: 'New Card' }
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await api.createCard('list-1', { id: 'card-1', title: 'New Card' })
    expect(result).toEqual(mockResponse)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/lists/list-1/cards'),
      expect.objectContaining({
        method: 'POST',
      })
    )
  })

  it('should update a card', async () => {
    const mockResponse = { id: 'card-1', title: 'Updated Card' }
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await api.updateCard('list-1', 'card-1', { title: 'Updated Card' })
    expect(result).toEqual(mockResponse)
  })

  it('should delete a card', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    await api.deleteCard('list-1', 'card-1')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/lists/list-1/cards/card-1'),
      expect.objectContaining({
        method: 'DELETE',
      })
    )
  })

  it('should move a card', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    await api.moveCard('card-1', 'list-1', 'list-2', 0)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/cards/card-1/move'),
      expect.objectContaining({
        method: 'POST',
      })
    )
  })

  it('should handle errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ error: 'Server error' }),
    })

    await expect(api.createList({})).rejects.toThrow()
  })

  it('should get board state', async () => {
    const mockResponse = { lists: [] }
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await api.getBoardState()
    expect(result).toEqual(mockResponse)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/board'),
      expect.objectContaining({
        method: 'GET',
      })
    )
  })

  it('should handle network errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'))

    await expect(api.createList({})).rejects.toThrow('Network error')
  })

  it('should handle JSON parse errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON')
      },
    })

    await expect(api.createList({})).rejects.toThrow()
  })
})

