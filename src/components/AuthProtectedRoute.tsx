import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { BiovaCoLogo } from './BiovaCoLogo';
import { useToast } from "@/hooks/use-toast";

interface AuthProtectedRouteProps {
  children: React.ReactNode;
}

const AuthProtectedRoute: React.FC<AuthProtectedRouteProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCheck = async (session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        setLoading(false);
        navigate('/unauthorized');
        return;
      }

      // STRICT DOMAIN CHECK
      if (!session.user.email?.endsWith('@biovaco.in')) {
        await supabase.auth.signOut();
        toast({
          title: "Access Denied",
          description: "Admin dashboard is restricted to @biovaco.in employee accounts only.",
          variant: "destructive"
        });
        setLoading(false);
        navigate('/unauthorized');
        return;
      }

      setLoading(false);
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        handleAuthCheck(session);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthCheck(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <BiovaCoLogo className="h-16 w-auto mx-auto mb-4 animate-pulse" />
          <p className="text-[#032E63] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !session) {
    return null; // Will redirect to auth
  }

  return <>{children}</>;
};

export default AuthProtectedRoute;