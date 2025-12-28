import React, { useState } from 'react'
import PropTypes from 'prop-types'

function MergeResolutionDialog({
  isOpen,
  conflict,
  onResolve,
  onCancel,
}) {
  const [selectedVersion, setSelectedVersion] = useState('server')

  if (!isOpen || !conflict) return null

  const { base, local, server, type, id } = conflict
  const item = type === 'list' ? local || server : local || server

  const handleResolve = () => {
    let resolved
    if (selectedVersion === 'local') {
      resolved = local
    } else if (selectedVersion === 'server') {
      resolved = server
    } else {
      // Manual merge - combine both
      resolved = {
        ...local,
        ...server,
        version: Math.max(local.version || 1, server.version || 1) + 1,
        lastModifiedAt: new Date().toISOString(),
      }
    }
    onResolve(id, resolved, type)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Resolve Conflict: {type === 'list' ? 'List' : 'Card'}
        </h2>
        <p className="text-gray-600 mb-6">
          Both local and server versions have been modified. Choose which version
          to keep:
        </p>

        <div className="space-y-4 mb-6">
          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              selectedVersion === 'local'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedVersion('local')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setSelectedVersion('local')
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center mb-2">
              <input
                type="radio"
                name="version"
                value="local"
                checked={selectedVersion === 'local'}
                onChange={() => setSelectedVersion('local')}
                className="mr-2"
              />
              <h3 className="font-semibold text-gray-800">Local Version</h3>
              <span className="ml-2 text-xs text-gray-500">
                (v{local.version || 1}, modified{' '}
                {local.lastModifiedAt
                  ? new Date(local.lastModifiedAt).toLocaleString()
                  : 'unknown'}
                )
              </span>
            </div>
            {type === 'list' ? (
              <div>
                <p className="text-sm text-gray-700">
                  <strong>Title:</strong> {local.title || 'Untitled'}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Cards:</strong> {local.cards?.length || 0}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-700">
                  <strong>Title:</strong> {local.title || 'Untitled'}
                </p>
                {local.description && (
                  <p className="text-sm text-gray-700">
                    <strong>Description:</strong> {local.description}
                  </p>
                )}
              </div>
            )}
          </div>

          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              selectedVersion === 'server'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedVersion('server')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setSelectedVersion('server')
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center mb-2">
              <input
                type="radio"
                name="version"
                value="server"
                checked={selectedVersion === 'server'}
                onChange={() => setSelectedVersion('server')}
                className="mr-2"
              />
              <h3 className="font-semibold text-gray-800">Server Version</h3>
              <span className="ml-2 text-xs text-gray-500">
                (v{server.version || 1}, modified{' '}
                {server.lastModifiedAt
                  ? new Date(server.lastModifiedAt).toLocaleString()
                  : 'unknown'}
                )
              </span>
            </div>
            {type === 'list' ? (
              <div>
                <p className="text-sm text-gray-700">
                  <strong>Title:</strong> {server.title || 'Untitled'}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Cards:</strong> {server.cards?.length || 0}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-700">
                  <strong>Title:</strong> {server.title || 'Untitled'}
                </p>
                {server.description && (
                  <p className="text-sm text-gray-700">
                    <strong>Description:</strong> {server.description}
                  </p>
                )}
              </div>
            )}
          </div>

          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              selectedVersion === 'merge'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedVersion('merge')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setSelectedVersion('merge')
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center mb-2">
              <input
                type="radio"
                name="version"
                value="merge"
                checked={selectedVersion === 'merge'}
                onChange={() => setSelectedVersion('merge')}
                className="mr-2"
              />
              <h3 className="font-semibold text-gray-800">
                Merge Both (Combine)
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              Combine changes from both versions
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleResolve}
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Resolve
          </button>
        </div>
      </div>
    </div>
  )
}

MergeResolutionDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  conflict: PropTypes.shape({
    type: PropTypes.oneOf(['list', 'card']).isRequired,
    id: PropTypes.string.isRequired,
    base: PropTypes.object,
    local: PropTypes.object.isRequired,
    server: PropTypes.object.isRequired,
  }),
  onResolve: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
}

export default MergeResolutionDialog

