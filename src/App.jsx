import React, { Suspense, lazy } from 'react'
import BoardProvider from './context/BoardProvider'
import Header from './components/Header'
import Toolbar from './components/Toolbar'
import Board from './components/Board'
import { useBoardContext } from './context/BoardProvider'
import { storage } from './services/storage'

// Lazy load heavy components
const MergeResolutionDialog = lazy(() => import('./components/MergeResolutionDialog'))

function AppContent() {
  const {
    addList,
    error,
    isOnline,
    isSyncing,
    queueLength,
    currentConflict,
    resolveConflict,
    clearError,
  } = useBoardContext()

  const handleClearBoard = () => {
    if (
      window.confirm(
        'Are you sure you want to clear the entire board? This action cannot be undone.'
      )
    ) {
      storage.clear()
      window.location.reload()
    }
  }

  const handleExportData = () => {
    const data = storage.load()
    if (data) {
      const dataStr = JSON.stringify(data, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'kanban-board-export.json'
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header
        onAddList={addList}
        isOnline={isOnline}
        isSyncing={isSyncing}
        queueLength={queueLength}
      />
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 mx-6 mt-2 flex justify-between items-center">
          <span>{error}</span>
          <button
            type="button"
            onClick={clearError}
            className="text-red-700 hover:text-red-900"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}
      <Toolbar onClearBoard={handleClearBoard} onExportData={handleExportData} />
      <Board />
      {currentConflict && (
        <Suspense
          fallback={
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-700">Loading conflict resolution...</span>
                </div>
              </div>
            </div>
          }
        >
          <MergeResolutionDialog
            isOpen={true}
            conflict={currentConflict}
            onResolve={(id, resolved, type) => {
              resolveConflict(id, resolved, type)
            }}
            onCancel={() => {
              // Skip this conflict, show next or close
              clearError()
            }}
          />
        </Suspense>
      )}
    </div>
  )
}

function App() {
  return (
    <BoardProvider>
      <AppContent />
    </BoardProvider>
  )
}

export default App
