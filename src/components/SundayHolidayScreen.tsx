import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BiovaCoLogo } from '@/components/BiovaCoLogo';
import { 
  Clock, 
  Calendar, 
  ShieldCheck, 
  LogOut, 
  RefreshCw, 
  Coffee, 
  Sparkles, 
  ChevronRight,
  Info,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { getNextHoliday } from '@/data/holidays';
import { format } from 'date-fns';

interface SundayHolidayScreenProps {
  userEmail?: string;
  userLabel?: string;
  userType?: string;
  onPreviewDismiss?: () => void;
  isPreview?: boolean;
}

const SUNDAY_THOUGHTS = [
  "“A Sunday well-spent brings a week of content. Recharge well for the upcoming sprint!”",
  "“Rest is not idleness, it is the key to clearer thinking and better innovation.”",
  "“Recharge your creative battery today. Fresh minds build the best biotechnology solutions.”",
  "“Enjoy your Sunday off. Stay curious, take rest, and get ready for Monday!”"
];

export const SundayHolidayScreen: React.FC<SundayHolidayScreenProps> = ({
  userEmail = '',
  userLabel = '',
  userType = '',
  onPreviewDismiss,
  isPreview = false,
}) => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [quoteIndex, setQuoteIndex] = useState(0);

  const cleanEmail = userEmail.toLowerCase();
  const cleanLabel = userLabel.toLowerCase();
  const cleanType = userType.toLowerCase();

  const isIntern = 
    cleanType.includes('intern') || 
    cleanLabel.includes('intern') || 
    cleanEmail.includes('intern');

  // Real-time countdown to Monday 00:00:00
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const nextMonday = new Date(now);
      
      const currentDay = now.getDay(); // 0 is Sunday
      const daysUntilMonday = currentDay === 0 ? 1 : (8 - currentDay) % 7 || 7;
      
      nextMonday.setDate(now.getDate() + daysUntilMonday);
      nextMonday.setHours(0, 0, 0, 0);

      const diff = nextMonday.getTime() - now.getTime();

      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const nextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % SUNDAY_THOUGHTS.length);
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-800 flex flex-col justify-between font-sans">
      {/* Top Professional Header Bar (Identical to Portal Header) */}
      <header className="bg-white border-b-2 border-[#7DA0FA] sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-3">
              <BiovaCoLogo className="h-8 w-auto" />
              <div className="flex flex-col">
                <span className="text-base font-semibold text-[#4B49AC] leading-tight">
                  BiovaCo Nexus
                </span>
                <span className="text-[10px] font-medium text-[#7DA0FA] uppercase tracking-wider leading-tight">
                  Admin Console
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {isPreview && onPreviewDismiss && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPreviewDismiss}
                  className="h-8 text-xs bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                >
                  Exit Preview (CEO Mode)
                </Button>
              )}

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#f2f6ff] border border-[#7DA0FA]/20 rounded-md">
                <div className="h-2 w-2 rounded-full bg-[#7DA0FA]" />
                <span className="text-xs text-[#4B49AC] font-medium">{userEmail || 'Staff'}</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-gray-600 hover:text-red-600 hover:bg-red-50 flex items-center gap-1.5 text-xs h-8"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Professional Body Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center">
        
        {/* Main Clean Card */}
        <Card className="w-full bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
          {/* Top subtle highlight stripe */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#4B49AC] via-[#7DA0FA] to-[#4B49AC]" />

          <CardContent className="p-6 sm:p-10 text-center">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[#4B49AC] mb-6">
              {isIntern ? (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-semibold">Intern Weekly Off-Day Pass</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-xs font-semibold">Scheduled Sunday Maintenance & Weekly Off</span>
                </>
              )}
            </div>

            {/* Main Heading & Message */}
            {isIntern ? (
              <div className="space-y-3 mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  आजादी है तुम्हें आज! 🌴
                </h2>
                <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
                  आज रविवार का दिन है — पूरा दिन आराम करो, नया कुछ सीखो और अपनी एनर्जी recharge करो।
                  <br />
                  <span className="font-semibold text-[#4B49AC] mt-1 inline-block">
                    लेकिन याद रहे, कल (Monday) से टाइम पर वापस आना ही है!
                  </span>
                </p>
              </div>
            ) : (
              <div className="space-y-3 mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Sunday Scheduled Maintenance & Off-Day
                </h2>
                <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
                  BiovaCo Nexus is currently undergoing routine weekly database maintenance, automated optimization, and security audits. 
                  All core modules and services will resume normal operations on Monday morning.
                </p>
              </div>
            )}

            {/* Countdown Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 sm:p-6 max-w-md mx-auto mb-8 shadow-xs">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                <Clock className="h-4 w-4 text-[#4B49AC]" />
                Portal Resumes In (Monday 00:00 AM)
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs">
                  <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <span className="block text-[10px] font-medium uppercase text-slate-500 mt-0.5">Hours</span>
                </div>

                <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs">
                  <span className="text-2xl sm:text-3xl font-bold text-[#4B49AC] font-mono">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <span className="block text-[10px] font-medium uppercase text-slate-500 mt-0.5">Minutes</span>
                </div>

                <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs">
                  <span className="text-2xl sm:text-3xl font-bold text-emerald-600 font-mono">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                  <span className="block text-[10px] font-medium uppercase text-slate-500 mt-0.5">Seconds</span>
                </div>
              </div>
            </div>

            {/* User Session Info Row */}
            <div className="border-t border-slate-100 pt-5 pb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left text-xs text-slate-600">
              <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-medium uppercase">Logged In User</span>
                <span className="font-semibold text-slate-800 truncate block mt-0.5">{userEmail || 'Team Member'}</span>
              </div>
              <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-medium uppercase">Assigned Role</span>
                <span className="font-semibold text-slate-800 truncate block mt-0.5">{userLabel || userType || (isIntern ? 'Intern' : 'Team Member')}</span>
              </div>
              <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-medium uppercase">System Status</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1.5 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Maintenance Routine Active
                </span>
              </div>
            </div>

            {/* Sunday Thought / Quote */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-4 mb-4 text-left flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Coffee className="h-4 w-4 text-[#4B49AC] mt-0.5 shrink-0" />
                <p className="text-xs text-slate-700 italic leading-relaxed">
                  {SUNDAY_THOUGHTS[quoteIndex]}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={nextQuote}
                className="h-6 px-2 text-[11px] text-[#4B49AC] hover:bg-indigo-100/60 shrink-0"
              >
                Next ⟳
              </Button>
            </div>

            {/* Next Upcoming Corporate / Market Holiday Banner */}
            {(() => {
              const nextHol = getNextHoliday(new Date());
              if (!nextHol) return null;
              return (
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-3.5 mb-6 flex items-center justify-between text-left shadow-sm border border-indigo-900/40">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-400/30">
                      <Calendar className="h-4 w-4 text-indigo-300" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Next Corporate / Market Holiday</p>
                      <p className="text-xs font-bold text-white mt-0.5">{nextHol.holiday.name}</p>
                      <p className="text-[10px] text-gray-300">{format(new Date(nextHol.holiday.date + "T00:00:00"), 'EEEE, MMMM d, yyyy')}</p>
                    </div>
                  </div>
                  <Badge className="bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-1 border-0">
                    in {nextHol.daysRemaining} days
                  </Badge>
                </div>
              );
            })()}

            {/* Primary Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                onClick={handleRefresh}
                className="bg-[#4B49AC] hover:bg-[#3f3e91] text-white font-medium text-xs px-5 py-2 h-9 rounded-lg shadow-xs flex items-center gap-2"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Check Portal Status
              </Button>

              <Button
                variant="outline"
                onClick={handleSignOut}
                className="border-slate-300 text-slate-700 hover:bg-slate-50 text-xs px-4 py-2 h-9 rounded-lg"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notice Info Footer */}
        <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
          <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span>Need urgent access? Executive leadership (CEO / MD) has uninterrupted 24/7 portal access.</span>
        </div>
      </main>

      {/* Clean Bottom Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} BiovaCo Nexus • Enterprise Operations & Management</span>
          <span className="text-slate-400">All rights reserved. Internal Administration Portal.</span>
        </div>
      </footer>
    </div>
  );
};
export default SundayHolidayScreen;
