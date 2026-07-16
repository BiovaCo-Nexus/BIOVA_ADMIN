import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from './use-toast';

export const useIdleTimeout = (timeoutMinutes: number = 15) => {
  const [isIdle, setIsIdle] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        setIsIdle(true);
        await supabase.auth.signOut();
        toast({
          title: "Session Expired",
          description: "You have been logged out due to inactivity for security reasons.",
          variant: "destructive"
        });
        navigate('/unauthorized');
      }, timeoutMinutes * 60 * 1000);
    };

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer));

    resetTimer(); // Initialize

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [timeoutMinutes, navigate, toast]);

  return isIdle;
};
