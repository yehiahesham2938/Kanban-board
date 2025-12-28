import React from 'react'
import PropTypes from 'prop-types'

function Header({ onAddList, isOnline, isSyncing, queueLength }) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Kanban Board</h1>
          {!isOnline && (
            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
              Offline
            </span>
          )}
          {isSyncing && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
              Syncing...
            </span>
          )}
          {queueLength > 0 && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
              {queueLength} pending
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onAddList('New List')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          + Add List
        </button>
      </div>
    </header>
  )
}

Header.propTypes = {
  onAddList: PropTypes.func.isRequired,
  isOnline: PropTypes.bool,
  isSyncing: PropTypes.bool,
  queueLength: PropTypes.number,
}

export default Header
