import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

// Suppress uncaught promise rejections from MSW
// These are often harmless network errors
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    // Suppress MSW-related "Failed to fetch" errors
    if (
      event.reason?.message?.includes('Failed to fetch') ||
      event.reason?.message?.includes('network error') ||
      (event.reason?.stack && event.reason.stack.includes('mockServiceWorker'))
    ) {
      event.preventDefault()
      // Optionally log in development
      if (import.meta.env.MODE === 'development') {
        console.debug('Suppressed MSW network error:', event.reason?.message)
      }
    }
  })
}

