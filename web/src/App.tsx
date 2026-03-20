import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"
import { MainLayout } from "./components/MainLayout"
import { BackgroundLayer } from "./components/BackgroundLayer"

// Temporary imports until pages are fully implemented
import { HomeDashboard } from "./pages/HomeDashboard"
import { AuthPage } from "./pages/AuthPage"
import { OnboardingPage } from "./pages/OnboardingPage"
import { CropsPage } from "./pages/CropsPage"
import { NotificationsPage } from "./pages/NotificationsPage"
import { ProfilePage } from "./pages/ProfilePage"

function ProtectedRoute() {
  const isAuthenticated = !!localStorage.getItem("userId")
  return isAuthenticated ? <Outlet /> : <Navigate to="/auth" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <BackgroundLayer />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomeDashboard />} />
            <Route path="/crops" element={<CropsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
