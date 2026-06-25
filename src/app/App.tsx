import { BrowserRouter, Routes, Route } from 'react-router'
import { isExtensionContext } from '../lib/environment'
import TabGraveyardApp from './components/TabGraveyardPopup'
import LandingPage from './pages/LandingPage'

export default function App() {
  if (isExtensionContext()) {
    return <TabGraveyardApp />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  )
}