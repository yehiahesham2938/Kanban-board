import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

// Suppress uncaught promise rejections from MSW
// These are often harmless network errors when MSW tries to handle non-API requests
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    // Suppress MSW-related "Failed to fetch" errors
    const reason = event.reason
    const message = reason?.message || ''
    const stack = reason?.stack || ''
    
    // Check if this is an MSW-related error
    const isMSWError = 
      message.includes('Failed to fetch') ||
      message.includes('network error') ||
      message.includes('FetchEvent') ||
      stack.includes('mockServiceWorker') ||
      stack.includes('passthrough')
    
    // Also check if it's related to the root page or static assets
    const url = reason?.url || ''
    const isNonAPIRequest = url && !url.includes('/api') && (
      url === window.location.origin + '/' ||
      url.includes('.html') ||
      url.includes('.css') ||
      url.includes('.js') ||
      url.includes('/assets/')
    )
    
    if (isMSWError || isNonAPIRequest) {
      event.preventDefault()
      // Silently suppress - these are expected when MSW bypasses non-API requests
      return
    }
  })
  
  // Also catch errors in the service worker context
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('error', (event) => {
      // Suppress service worker errors related to passthrough
      if (event.message?.includes('Failed to fetch') || 
          event.message?.includes('network error')) {
        event.preventDefault()
      }
    })
  }
}

