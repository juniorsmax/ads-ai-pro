import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initPostHog } from './lib/analytics'
import { initClarity } from './lib/clarity'

initPostHog()
initClarity()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
