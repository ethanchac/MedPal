import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Authentication from './components/authentication/Authentication.jsx'
import MainScreen from './components/mainscreen/MainScreen.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MainScreen />
  </StrictMode>,
)
