import { useState } from 'react'

export function useUndoRedo() {
  const [history, setHistory] = useState([])
  return { history, undo: () => {}, redo: () => {} }
}

