import React from 'react'
import BoardProvider from './context/BoardProvider'
import Header from './components/Header'
import Toolbar from './components/Toolbar'
import Board from './components/Board'
import MergeResolutionDialog from './components/MergeResolutionDialog'
import { useBoardContext } from './context/BoardProvider'
import { storage } from './services/storage'

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
