import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AccessibilityProvider } from "@/components/AccessibilityProvider"
import Auth from "./pages/Auth"
import Admin from "./pages/Admin"
import AuthProtectedRoute from "@/components/AuthProtectedRoute"

const App = () => {
  return (
    <AccessibilityProvider>
      <BrowserRouter>
        <div id="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/admin"
              element={
                <AuthProtectedRoute>
                  <Admin />
                </AuthProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AccessibilityProvider>
  )
}

export default App
