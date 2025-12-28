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
      onUnhandledRequest: 'bypass',
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

