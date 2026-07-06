import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import RootLayout from './layouts/RootLayout'
import AppLayout from './layouts/AppLayout'
import AuthGuard from './components/AuthGuard'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import AboutPage from './pages/AboutPage'
import PrivacyPage from './pages/PrivacyPage'
import DashboardPage from './pages/DashboardPage'
import CVScanPage from './pages/CVScanPage'
import AnalysisListPage from './pages/AnalysisListPage'
import AnalysisDetailPage from './pages/AnalysisDetailPage'
import MockInterviewPage from './pages/MockInterviewPage'
import PricingPage from './pages/PricingPage'
import PaymentPage from './pages/PaymentPage'
import ProfilePage from './pages/ProfilePage'
import { useApp } from './contexts/AppContext'
import { useTheme } from './contexts/ThemeContext'

function ThemeBridge() {
  const { isAuthenticated } = useApp()
  const { setAuthTheming } = useTheme()
  useEffect(() => {
    setAuthTheming(isAuthenticated)
  }, [isAuthenticated, setAuthTheming])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeBridge />
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
        </Route>

        <Route
          element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/cv-scan" element={<CVScanPage />} />
          <Route path="/analysis" element={<AnalysisListPage />} />
          <Route path="/analysis/:id" element={<AnalysisDetailPage />} />
          <Route path="/mock-interview" element={<MockInterviewPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route path="/cv-result" element={<Navigate to="/analysis" replace />} />
        <Route path="/settings" element={<Navigate to="/profile?tab=settings" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
