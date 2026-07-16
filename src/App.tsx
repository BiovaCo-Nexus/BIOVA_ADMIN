import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AccessibilityProvider } from "@/components/AccessibilityProvider"
import { supabase } from "@/integrations/supabase/client"
import Auth from "./pages/Auth"
import Admin from "./pages/Admin"
import AuthProtectedRoute from "@/components/AuthProtectedRoute"

/**
 * SECURITY DESIGN:
 *
 * - "/" and any unknown URL → silent blank page (portal existence hidden)
 * - "/nexus-portal-login"   → login page (only people with this link can access)
 * - "/admin"                → protected dashboard (session required)
 *
 * If someone accidentally discovers /admin but has no session,
 * they get a silent blank page — NOT a login redirect.
 * Only authorised staff who already have the login URL can authenticate.
 */

/** Silent blank page — reveals nothing about the portal */
const SilentBlank = () => (
  <div className="min-h-screen bg-white" aria-hidden="true" />
);

/** Root: if already authenticated → go to admin, else → silent blank */
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
    return <div className="min-h-screen bg-white" />;
  }

  // Authenticated staff → admin dashboard
  // Unknown visitor → blank page (no hint that admin portal exists)
  return isAuthenticated
    ? <Navigate to="/admin" replace />
    : <SilentBlank />;
};

const App = () => {
  return (
    <AccessibilityProvider>
      <BrowserRouter>
        <div id="main-content">
          <Routes>
            {/* Root: authenticated → admin, else → silent blank */}
            <Route path="/" element={<RootRedirect />} />

            {/* Login — only people with this exact URL can reach it */}
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

            {/*
             * Catch-all: ANY unknown URL → silent blank page.
             * We do NOT redirect to login — that would expose the portal.
             */}
            <Route path="*" element={<SilentBlank />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AccessibilityProvider>
  )
}

export default App
