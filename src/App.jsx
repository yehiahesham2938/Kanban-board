import React from 'react'
import BoardProvider from './context/BoardProvider'
import Header from './components/Header'
import Toolbar from './components/Toolbar'
import Board from './components/Board'
import { useBoardContext } from './context/BoardProvider'
import { storage } from './services/storage'

function AppContent() {
  const { addList } = useBoardContext()

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
      <Header onAddList={addList} />
      <Toolbar onClearBoard={handleClearBoard} onExportData={handleExportData} />
      <Board />
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
