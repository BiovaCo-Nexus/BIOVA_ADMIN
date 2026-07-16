import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AccessibilityProvider } from "@/components/AccessibilityProvider"
import { supabase } from "@/integrations/supabase/client"
import Auth from "./pages/Auth"
import Admin from "./pages/Admin"
import AuthProtectedRoute from "@/components/AuthProtectedRoute"

/**
 * Root redirect: always send to login first.
 * After login, Auth page handles the redirect to /admin.
 * This way visiting any URL (including /) never shows 404.
 */
const RootRedirect = () => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && session.user.email?.endsWith('@biovaco.in')) {
        setIsAuthenticated(true);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <p className="text-[#032E63] font-medium">Loading...</p>
      </div>
    );
  }

  // Already logged in → go to admin; else → login page
  return isAuthenticated
    ? <Navigate to="/admin" replace />
    : <Navigate to="/nexus-portal-login" replace />;
};

const App = () => {
  return (
    <AccessibilityProvider>
      <BrowserRouter>
        <div id="main-content">
          <Routes>
            {/* Root → smart redirect (never 404) */}
            <Route path="/" element={<RootRedirect />} />

            {/* Login page */}
            <Route path="/nexus-portal-login" element={<Auth />} />

            {/* Protected admin dashboard */}
            <Route
              path="/admin"
              element={
                <AuthProtectedRoute>
                  <Admin />
                </AuthProtectedRoute>
              }
            />

            {/* Catch-all: ANY unknown URL → login page (not a scary 404) */}
            <Route path="*" element={<Navigate to="/nexus-portal-login" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AccessibilityProvider>
  )
}

export default App
