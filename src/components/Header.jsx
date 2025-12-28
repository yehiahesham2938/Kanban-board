import React from 'react'
import PropTypes from 'prop-types'

function Header({ onAddList }) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Kanban Board</h1>
        <button
          type="button"
          onClick={onAddList}
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
}

export default Header
