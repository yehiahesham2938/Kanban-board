import '@testing-library/jest-dom'
import { v4 as uuidv4 } from 'uuid'

// Mock crypto.randomUUID for test environment
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => uuidv4(),
  },
  writable: true,
})

