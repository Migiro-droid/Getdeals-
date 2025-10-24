import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Gift, Flame, TrendingUp, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function BlackFridayPage() {
  const { settings } = useAdmin();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!settings.blackFridayCountdownDate) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      const targetDate = new Date(settings.blackFridayCountdownDate).getTime();
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [settings.blackFridayCountdownDate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-red-950 to-black overflow-hidden">
      {/* Floating Background Elements - More Subtle */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-96 h-96 bg-red-900/40 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-800/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-red-950/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        {/* Main Heading */}
        <div className="text-center mb-6 space-y-3">
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red-700 to-red-800 drop-shadow-2xl leading-tight whitespace-nowrap">
            BLACK FRIDAY
          </h1>
          
          <div>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-800 to-red-900 text-red-200 px-4 py-2 rounded-full font-black text-xs md:text-sm uppercase tracking-widest shadow-lg border border-red-700">
              Biggest Sale of the Year
            </div>
          </div>

          <p className="text-lg md:text-2xl font-bold text-gray-100">
            Up to <span className="text-red-500 text-2xl animate-pulse font-black">70% OFF</span> Everything
          </p>

          <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto">
             The most anticipated shopping event of the year is coming! Get ready for amazing deals on thousands of products.
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="mb-8 w-full max-w-4xl">
          {/* Large Countdown Boxes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {/* Days */}
            <div className="group">
              <div className="relative overflow-hidden rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-950 opacity-90"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 opacity-0 group-hover:opacity-50 transition-all duration-300"></div>
                
                <div className="relative p-3 md:p-4 text-center border border-gray-700 group-hover:border-red-600 transition-colors">
                  <div className="text-3xl md:text-4xl font-black text-red-500 drop-shadow-lg">
                    {String(timeLeft.days).padStart(2, '0')}
                  </div>
                  <div className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-wider mt-1">
                    Days
                  </div>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="group">
              <div className="relative overflow-hidden rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-950 opacity-90"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 opacity-0 group-hover:opacity-50 transition-all duration-300"></div>
                
                <div className="relative p-3 md:p-4 text-center border border-gray-700 group-hover:border-red-600 transition-colors">
                  <div className="text-3xl md:text-4xl font-black text-red-500 drop-shadow-lg">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </div>
                  <div className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-wider mt-1">
                    Hours
                  </div>
                </div>
              </div>
            </div>

            {/* Minutes */}
            <div className="group">
              <div className="relative overflow-hidden rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-950 opacity-90"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 opacity-0 group-hover:opacity-50 transition-all duration-300"></div>
                
                <div className="relative p-3 md:p-4 text-center border border-gray-700 group-hover:border-red-600 transition-colors">
                  <div className="text-3xl md:text-4xl font-black text-red-500 drop-shadow-lg">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </div>
                  <div className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-wider mt-1">
                    Minutes
                  </div>
                </div>
              </div>
            </div>

            {/* Seconds */}
            <div className="group">
              <div className="relative overflow-hidden rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-950 opacity-90"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 opacity-0 group-hover:opacity-50 transition-all duration-300"></div>
                
                <div className="relative p-3 md:p-4 text-center border border-gray-700 group-hover:border-red-600 transition-colors">
                  <div className="text-3xl md:text-4xl font-black text-red-500 drop-shadow-lg">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </div>
                  <div className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-wider mt-1">
                    Seconds
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Message */}
        <div className="text-center space-y-4 mb-8">
          <div className="inline-block">
            <div className="bg-gradient-to-r from-red-700 to-red-800 p-0.5 rounded-lg border border-red-600">
              <div className="bg-gray-950 px-6 py-2 rounded-lg">
                <p className="text-lg md:text-2xl font-black text-red-500">
                  COMING SOON
                </p>
              </div>
            </div>
          </div>

          <p className="text-gray-400 text-sm md:text-base max-w-3xl mx-auto leading-relaxed">
            Get ready for amazing deals! Exclusive discounts, incredible limited-time offers, and unbeatable prices on your favorite products. Don't miss the biggest shopping event of the year!
          </p>
        </div>

        {/* Promotional Messages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mb-8">
          {/* Card 1 */}
          <div className="group relative overflow-hidden rounded-lg p-4 md:p-5 bg-gray-900/40 border border-gray-700 hover:border-red-600/50 transition-all duration-300 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-red-900/5 to-red-800/5 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
            <div className="relative">
              <Flame className="h-8 w-8 text-red-500 mb-2" />
              <h3 className="text-base font-black text-red-500 mb-1">Amazing Prices</h3>
              <p className="text-gray-400 text-xs md:text-sm">
                Incredible savings on everything you love.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="group relative overflow-hidden rounded-lg p-4 md:p-5 bg-gray-900/40 border border-gray-700 hover:border-red-600/50 transition-all duration-300 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-red-900/5 to-red-800/5 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
            <div className="relative">
              <Gift className="h-8 w-8 text-red-500 mb-2" />
              <h3 className="text-base font-black text-red-500 mb-1">Limited Deals</h3>
              <p className="text-gray-400 text-xs md:text-sm">
                Limited quantities available. First come, first served!
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="group relative overflow-hidden rounded-lg p-4 md:p-5 bg-gray-900/40 border border-gray-700 hover:border-red-600/50 transition-all duration-300 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-red-900/5 to-red-800/5 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
            <div className="relative">
              <TrendingUp className="h-8 w-8 text-red-500 mb-2" />
              <h3 className="text-base font-black text-red-500 mb-1">Huge Savings</h3>
              <p className="text-gray-400 text-xs md:text-sm">
                Save on thousands of products across all categories!
              </p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <Button 
            size="sm"
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm md:text-base rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 border border-red-500"
            asChild
          >
            <Link to="/">
              <Clock className="h-4 w-4 mr-2" />
              Back to Homepage
            </Link>
          </Button>

          <Button 
            size="sm"
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm md:text-base rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 border border-red-500"
            asChild
          >
            <Link to="/baskets">
              <Zap className="h-4 w-4 mr-2" />
              Shop Products
            </Link>
          </Button>
        </div>

        {/* Bottom Message */}
        <div className="text-center space-y-2">
          <p className="text-gray-400 text-xs md:text-sm">
            Be the first to know about Black Friday deals!
          </p>
          <p className="text-red-500 font-bold text-xs md:text-sm">
             Mark your calendar • Set reminders • Tell your friends
          </p>
        </div>
      </div>

      {/* Floating Badges */}
      <div className="fixed top-4 right-4 z-20 space-y-2 md:space-y-3">
        <div className="bg-gradient-to-r from-red-900 to-red-950 text-red-300 px-3 py-1.5 rounded-full font-bold text-xs md:text-sm shadow-lg animate-bounce border border-red-700">
          🔥 UP TO 70% OFF
        </div>
        <div className="bg-gradient-to-r from-red-800 to-red-900 text-red-200 px-3 py-1.5 rounded-full font-bold text-xs md:text-sm shadow-lg animate-bounce border border-red-700" style={{ animationDelay: '0.2s' }}>
          ⚡ LIMITED TIME
        </div>
      </div>

      {/* Corner Decorations */}
      <div className="fixed top-8 left-8 text-6xl md:text-8xl opacity-5 pointer-events-none">🛍️</div>
      <div className="fixed bottom-8 right-8 text-6xl md:text-8xl opacity-5 pointer-events-none">🎁</div>
    </div>
  );
}
