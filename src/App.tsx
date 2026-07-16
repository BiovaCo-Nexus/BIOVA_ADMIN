import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AccessibilityProvider } from "@/components/AccessibilityProvider"
import { supabase } from "@/integrations/supabase/client"
import Auth from "./pages/Auth"
import Admin from "./pages/Admin"
import AuthProtectedRoute from "@/components/AuthProtectedRoute"

const Unauthorized = () => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
    <h1 className="text-4xl font-bold text-gray-800 mb-4">404 - Not Found</h1>
    <p className="text-gray-600">The page you are looking for does not exist.</p>
  </div>
);

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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <p className="text-gray-500 font-medium">Checking authorization...</p>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/admin" replace /> : <Navigate to="/unauthorized" replace />;
};

const App = () => {
  return (
    <AccessibilityProvider>
      <BrowserRouter>
        <div id="main-content">
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/nexus-portal-login" element={<Auth />} />
            <Route
              path="/admin"
              element={
                <AuthProtectedRoute>
                  <Admin />
                </AuthProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/unauthorized" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AccessibilityProvider>
  )
}

export default App
