import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './styles/global.css'
import './styles/components.css'

// Initialize MSW
async function enableMocking() {
  if (import.meta.env.MODE !== 'development') {
    return
  }

  try {
    const { worker } = await import('./mocks/browser')
    await worker.start({
      onUnhandledRequest: (request, print) => {
        // Get the URL pathname to determine if this is an API request
        let pathname = ''
        try {
          const url = typeof request.url === 'string' 
            ? new URL(request.url)
            : request.url instanceof URL
            ? request.url
            : new URL(request.url?.href || request.url?.toString() || '', window.location.origin)
          pathname = url.pathname
        } catch (e) {
          // If we can't parse the URL, bypass it
          return
        }
        
        // Only handle API requests - bypass everything else silently
        if (!pathname.startsWith('/api')) {
          return // Bypass non-API requests (page loads, static assets, etc.)
        }
        
        // For unhandled API requests, show a warning
        print.warning()
      },
      serviceWorker: {
        url: '/mockServiceWorker.js',
        options: {
          scope: '/',
        },
      },
      quiet: false,
    })
    console.log('MSW started successfully')
  } catch (error) {
    console.warn('MSW failed to start:', error)
    console.warn('App will continue without MSW')
    // Suppress the error to prevent console spam
    return
  }
}

// Start the app
async function startApp() {
  await enableMocking()
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

startApp().catch((error) => {
  console.error('Failed to start app:', error)
  // Render app anyway
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})

