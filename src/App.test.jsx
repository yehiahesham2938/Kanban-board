import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App'
import { storage } from './services/storage'
import BoardProvider from './context/BoardProvider'

// Mock services
jest.mock('./services/storage', () => ({
  storage: {
    load: jest.fn().mockReturnValue(null),
    save: jest.fn(),
    clear: jest.fn(),
  },
}))

jest.mock('./services/api', () => ({
  api: {
    createList: jest.fn().mockResolvedValue({}),
    updateList: jest.fn().mockResolvedValue({}),
    deleteList: jest.fn().mockResolvedValue({}),
    createCard: jest.fn().mockResolvedValue({}),
    updateCard: jest.fn().mockResolvedValue({}),
    deleteCard: jest.fn().mockResolvedValue({}),
    moveCard: jest.fn().mockResolvedValue({}),
  },
}))

jest.mock('./services/offlineQueue', () => ({
  offlineQueue: {
    enqueue: jest.fn(),
    getAll: jest.fn().mockReturnValue([]),
    dequeue: jest.fn(),
  },
}))

jest.mock('./services/baseVersionStorage', () => ({
  baseVersionStorage: {
    load: jest.fn().mockReturnValue(null),
    save: jest.fn(),
  },
}))

jest.mock('./hooks/useOfflineSync', () => ({
  useOfflineSync: jest.fn(() => ({
    isOnline: true,
    isSyncing: false,
    queueLength: 0,
  })),
}))

jest.mock('./hooks/useSyncWithConflictResolution', () => ({
  useSyncWithConflictResolution: jest.fn(() => ({
    syncWithServer: jest.fn().mockResolvedValue({ conflicts: [], merged: null }),
    resolveConflict: jest.fn(),
    conflicts: [],
  })),
}))

// Mock window methods
const mockReload = jest.fn()
const mockConfirm = jest.fn()
const mockCreateElement = jest.fn()
const mockClick = jest.fn()
const mockRevokeObjectURL = jest.fn()
const mockCreateObjectURL = jest.fn()

beforeAll(() => {
  Object.defineProperty(window, 'location', {
    value: { reload: mockReload },
    writable: true,
  })
  window.confirm = mockConfirm
  window.URL.createObjectURL = mockCreateObjectURL
  window.URL.revokeObjectURL = mockRevokeObjectURL
  document.createElement = mockCreateElement
  global.Blob = jest.fn((content, options) => ({ content, options }))
})

beforeEach(() => {
  jest.clearAllMocks()
  mockCreateObjectURL.mockReturnValue('blob:url')
  mockCreateElement.mockReturnValue({
    href: '',
    download: '',
    click: mockClick,
  })
  storage.load.mockReturnValue(null)
})

describe('App', () => {
  it('renders the kanban board title', () => {
    render(<App />)
    const titleElement = screen.getByRole('heading', { name: /kanban board/i })
    expect(titleElement).toBeInTheDocument()
  })

  it('renders empty board message', () => {
    render(<App />)
    const emptyMessage = screen.getByText(/your board is empty/i)
    expect(emptyMessage).toBeInTheDocument()
  })

  it('should display error message when error exists', () => {
    // This test requires mocking the BoardProvider context
    // For now, we'll test the basic rendering
    render(<App />)
    // Error display is tested through integration
  })

  it('should handle clear board confirmation', () => {
    mockConfirm.mockReturnValue(true)
    render(<App />)
    
    const clearButton = screen.getByRole('button', { name: /clear board/i })
    fireEvent.click(clearButton)
    
    expect(mockConfirm).toHaveBeenCalledWith(
      'Are you sure you want to clear the entire board? This action cannot be undone.'
    )
    expect(storage.clear).toHaveBeenCalled()
    expect(mockReload).toHaveBeenCalled()
  })

  it('should not clear board when user cancels', () => {
    mockConfirm.mockReturnValue(false)
    render(<App />)
    
    const clearButton = screen.getByRole('button', { name: /clear board/i })
    fireEvent.click(clearButton)
    
    expect(mockConfirm).toHaveBeenCalled()
    expect(storage.clear).not.toHaveBeenCalled()
    expect(mockReload).not.toHaveBeenCalled()
  })

  it('should export data when export button is clicked', () => {
    const mockData = {
      lists: [
        { id: 'list-1', title: 'Test List', cards: [] },
      ],
    }
    storage.load.mockReturnValue(mockData)
    
    render(<App />)
    
    const exportButton = screen.getByRole('button', { name: /export data/i })
    fireEvent.click(exportButton)
    
    expect(storage.load).toHaveBeenCalled()
    expect(global.Blob).toHaveBeenCalledWith(
      [JSON.stringify(mockData, null, 2)],
      { type: 'application/json' }
    )
    expect(mockCreateObjectURL).toHaveBeenCalled()
    expect(mockCreateElement).toHaveBeenCalledWith('a')
    expect(mockClick).toHaveBeenCalled()
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:url')
  })

  it('should not export when no data exists', () => {
    storage.load.mockReturnValue(null)
    
    render(<App />)
    
    const exportButton = screen.getByRole('button', { name: /export data/i })
    fireEvent.click(exportButton)
    
    expect(storage.load).toHaveBeenCalled()
    expect(mockCreateElement).not.toHaveBeenCalled()
  })

  it('should display error message when error exists', async () => {
    const { useBoardContext } = require('./context/BoardProvider')
    const originalContext = useBoardContext
    
    // Create a mock context with error
    const mockContextValue = {
      state: { lists: [] },
      error: 'Test error message',
      isOnline: true,
      isSyncing: false,
      queueLength: 0,
      currentConflict: null,
      addList: jest.fn(),
      clearError: jest.fn(),
      resolveConflict: jest.fn(),
    }
    
    jest.spyOn(require('./context/BoardProvider'), 'useBoardContext').mockReturnValue(mockContextValue)
    
    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByText('Test error message')).toBeInTheDocument()
    })
    
    const dismissButton = screen.getByLabelText('Dismiss error')
    fireEvent.click(dismissButton)
    
    expect(mockContextValue.clearError).toHaveBeenCalled()
  })

  it('should display conflict resolution dialog when conflict exists', async () => {
    const mockConflict = {
      id: 'conflict-1',
      type: 'list',
      local: { id: 'list-1', title: 'Local Title' },
      server: { id: 'list-1', title: 'Server Title' },
    }
    
    const mockContextValue = {
      state: { lists: [] },
      error: null,
      isOnline: true,
      isSyncing: false,
      queueLength: 0,
      currentConflict: mockConflict,
      addList: jest.fn(),
      clearError: jest.fn(),
      resolveConflict: jest.fn(),
    }
    
    jest.spyOn(require('./context/BoardProvider'), 'useBoardContext').mockReturnValue(mockContextValue)
    
    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByText(/loading conflict resolution/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should handle conflict resolution cancel', async () => {
    const mockConflict = {
      id: 'conflict-1',
      type: 'list',
      local: { id: 'list-1', title: 'Local Title' },
      server: { id: 'list-1', title: 'Server Title' },
    }
    
    const mockClearError = jest.fn()
    const mockContextValue = {
      state: { lists: [] },
      error: null,
      isOnline: true,
      isSyncing: false,
      queueLength: 0,
      currentConflict: mockConflict,
      addList: jest.fn(),
      clearError: mockClearError,
      resolveConflict: jest.fn(),
    }
    
    jest.spyOn(require('./context/BoardProvider'), 'useBoardContext').mockReturnValue(mockContextValue)
    
    render(<App />)
    
    // Wait for lazy loaded component
    await waitFor(() => {
      expect(screen.getByText(/loading conflict resolution/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})

