import React from 'react'
import PropTypes from 'prop-types'

function Toolbar({ onClearBoard, onExportData }) {
  return (
    <div className="bg-gray-50 border-b border-gray-200 px-6 py-2 flex justify-end gap-3">
      {onExportData && (
        <button
          type="button"
          onClick={onExportData}
          className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          Export Data
        </button>
      )}
      {onClearBoard && (
        <button
          type="button"
          onClick={onClearBoard}
          className="px-3 py-1 text-sm text-red-600 bg-white border border-red-300 rounded hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          Clear Board
        </button>
      )}
    </div>
  )
}

Toolbar.propTypes = {
  onClearBoard: PropTypes.func,
  onExportData: PropTypes.func,
}

export default Toolbar
