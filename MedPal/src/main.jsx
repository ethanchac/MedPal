import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Authentication from './components/authentication/Authentication.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Authentication />
  </StrictMode>,
)
