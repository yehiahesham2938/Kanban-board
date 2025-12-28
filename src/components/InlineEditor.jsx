import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

function InlineEditor({
  value,
  onSave,
  onCancel,
  placeholder = 'Enter text...',
  className = '',
  multiline = false,
}) {
  const [editValue, setEditValue] = useState(() => {
    if (typeof value === 'string') return value
    if (value == null) return ''
    return String(value)
  })
  const inputRef = useRef(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      if (multiline) {
        inputRef.current.select()
      }
    }
  }, [multiline])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editValue.trim()) {
      onSave(editValue.trim())
    } else if (onCancel) {
      onCancel()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      handleSubmit(e)
    } else if (e.key === 'Escape') {
      if (onCancel) onCancel()
    } else if (e.key === 'Enter' && multiline && (e.ctrlKey || e.metaKey)) {
      handleSubmit(e)
    }
  }

  const InputComponent = multiline ? 'textarea' : 'input'

  return (
    <form onSubmit={handleSubmit} className={className}>
      <InputComponent
        ref={inputRef}
        type="text"
        value={String(editValue || '')}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={multiline ? 3 : undefined}
      />
    </form>
  )
}

InlineEditor.propTypes = {
  value: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  multiline: PropTypes.bool,
}

export default InlineEditor

