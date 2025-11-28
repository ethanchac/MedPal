import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <div style={{ color: 'black' }}>Hello World</div>
//   </StrictMode>,
// )
