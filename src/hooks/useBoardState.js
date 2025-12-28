import { useState } from 'react'

export function useBoardState() {
  const [state, setState] = useState({})
  return [state, setState]
}

