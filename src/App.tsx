import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AccessibilityProvider } from "@/components/AccessibilityProvider"
import { supabase } from "@/integrations/supabase/client"
import Auth from "./pages/Auth"
import Admin from "./pages/Admin"
import AuthProtectedRoute from "@/components/AuthProtectedRoute"



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
 // Unknown visitor → auth page
 return isAuthenticated
 ? <Navigate to="/admin" replace />
 : <Navigate to="/auth" replace />;
};

const App = () => {
 return (
 <AccessibilityProvider>
 <BrowserRouter>
 <div id="main-content">
 <Routes>
 {/* Root: authenticated → admin, else → silent blank */}
 <Route path="/" element={<RootRedirect />} />

 {/* Login */}
 <Route path="/auth" element={<Auth />} />

 {/* Protected admin dashboard */}
 <Route
 path="/admin"
 element={
 <AuthProtectedRoute>
 <Admin />
 </AuthProtectedRoute>
 }
 />

 {/* Catch-all: redirect unknown URLs to root */}
 <Route path="*" element={<Navigate to="/" replace />} />
 </Routes>
 </div>
 </BrowserRouter>
 </AccessibilityProvider>
 )
}

export default App
