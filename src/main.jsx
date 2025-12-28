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
        try {
          // Get the URL from the request
        // MSW request.url can be a string or URL object
          const urlString = typeof request.url === 'string' 
            ? request.url 
            : request.url?.href || request.url?.toString() || ''
          
          // Only bypass requests that are not API requests
          // This prevents MSW from trying to handle page loads and other non-API requests
          if (urlString && !urlString.includes('/api')) {
            return // Bypass non-API requests
          }
          
          // For unhandled API requests, use the default behavior
          print.warning()
        } catch (error) {
          // If we can't parse the URL, just bypass the request
          return
        }
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

