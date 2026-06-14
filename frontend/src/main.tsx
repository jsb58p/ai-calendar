import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App.tsx'

if (process.env.NODE_ENV !== 'production') {
  import('@axe-core/react').then((axe) => axe.default(React, ReactDOM, 1000))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
