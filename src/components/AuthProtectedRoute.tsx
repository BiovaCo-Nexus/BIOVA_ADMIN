import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { BiovaCoLogo } from './BiovaCoLogo';

interface AuthProtectedRouteProps {
 children: React.ReactNode;
}

/**
 * SECURITY BEHAVIOUR:
 *
 * ✅ Valid @biovaco.in session → render admin dashboard
 * 🔇 No session → silent blank (NOT login redirect)
 * 🔇 Wrong domain session → sign out silently → silent blank
 *
 * We intentionally do NOT redirect to the login page here.
 * If someone stumbles onto /admin without knowing the login URL,
 * they see nothing — no hint of where to authenticate.
 * Only authorised staff who already have the /nexus-portal-login
 * bookmark/link can log in.
 */
const AuthProtectedRoute: React.FC<AuthProtectedRouteProps> = ({ children }) => {
 const [user, setUser] = useState<User | null>(null);
 const [session, setSession] = useState<Session | null>(null);
 const [loading, setLoading] = useState(true);
 const navigate = useNavigate();

 useEffect(() => {
 const handleAuthCheck = async (session: Session | null) => {
 setSession(session);
 setUser(session?.user ?? null);

 if (!session?.user) {
 // No session — go silent blank, not login page
 setLoading(false);
 navigate('/', { replace: true });
 return;
 }

 // STRICT DOMAIN CHECK — only @biovaco.in allowed
 if (!session.user.email?.endsWith('@biovaco.in')) {
 // Sign out silently — no toast, no hint
 await supabase.auth.signOut();
 setLoading(false);
 navigate('/', { replace: true });
 return;
 }

 setLoading(false);
 };

 const { data: { subscription } } = supabase.auth.onAuthStateChange(
 (_event, session) => {
 handleAuthCheck(session);
 }
 );

 supabase.auth.getSession().then(({ data: { session } }) => {
 handleAuthCheck(session);
 });

 return () => subscription.unsubscribe();
 }, [navigate]);

 if (loading) {
 return (
 <div className="min-h-screen bg-muted/20 flex items-center justify-center">
 <div className="text-center">
 <BiovaCoLogo className="h-16 w-auto mx-auto mb-4 animate-pulse" />
 <p className="text-foreground font-medium">Loading...</p>
 </div>
 </div>
 );
 }

 if (!user || !session) {
 return null;
 }

 return <>{children}</>;
};

export default AuthProtectedRoute;