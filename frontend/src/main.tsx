import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppWithChart from './AppWithChart.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWithChart />
  </StrictMode>,
)
