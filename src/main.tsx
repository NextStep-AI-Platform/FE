import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import { AppProvider } from './contexts/AppContext'
import ToastContainer from './components/ToastContainer'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <AppProvider>
          <App />
          <ToastContainer />
        </AppProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
)
