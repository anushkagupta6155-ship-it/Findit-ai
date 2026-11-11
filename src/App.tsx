import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { SearchProvider } from './context/SearchContext'
import { CameraErrorPage } from './pages/CameraErrorPage'
import { CameraPrepPage } from './pages/CameraPrepPage'
import { ConfirmPage } from './pages/ConfirmPage'
import { CropPage } from './pages/CropPage'
import { LandingPage } from './pages/LandingPage'
import { ScanPage } from './pages/ScanPage'
import { StillImagePage } from './pages/StillImagePage'
import { SummaryPage } from './pages/SummaryPage'
import { UploadPage } from './pages/UploadPage'

export default function App() {
  return (
    <SearchProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/crop" element={<CropPage />} />
          <Route path="/confirm" element={<ConfirmPage />} />
          <Route path="/camera-prep" element={<CameraPrepPage />} />
          <Route path="/camera-error" element={<CameraErrorPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/still" element={<StillImagePage />} />
          <Route path="/summary" element={<SummaryPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SearchProvider>
  )
}
