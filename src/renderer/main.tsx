import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/index.css'

const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('Root element not found')
  document.body.innerHTML = '<div id="root"></div>'
}

const root = ReactDOM.createRoot(rootElement!)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
