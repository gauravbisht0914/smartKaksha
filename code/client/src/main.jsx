import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { SWRConfig } from 'swr'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './lib/auth.jsx'
import { fetcher } from './lib/api.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SWRConfig value={{ fetcher, revalidateOnFocus: false, shouldRetryOnError: false }}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </SWRConfig>
  </StrictMode>,
)
