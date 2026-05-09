import { Clock, Star, TrendingUp, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

function useCountdown() {
  const getTimeLeft = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
    return {
      hours: String(Math.floor(diff / 3600)).padStart(2, '0'),
      minutes: String(Math.floor((diff % 3600) / 60)).padStart(2, '0'),
      seconds: String(diff % 60).padStart(2, '0'),
    };
  };

  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  return timeLeft;
}

export function TodayDeals() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { hours, minutes, seconds } = useCountdown();


  useEffect(() => {
    const fetchDeals = async () => {
      setLoading(true);
      try {
        // Fetch products marked as deals, or fetch from a 'deals' table
        const { data } = await supabase.from('products').select('*').eq('is_deal', true).eq('status', 'Active');
        if (data) setDeals(data);
      } catch (error) {
        console.error('Error fetching deals:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDeals();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Premium Header Banner */}
      <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-secondary text-white py-16 relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>
        
        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-bold tracking-widest uppercase mb-6 text-yellow-300 border border-white/10 shadow-[0_0_15px_rgba(253,224,71,0.3)]">
            <span className="relative flex h-2 w-2 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Live Flash Sales
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-4 drop-shadow-lg">Today's <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-accent">Sacred Deals</span></h1>
          <p className="text-lg md:text-xl text-primary-100 max-w-2xl mb-8">Exclusive 24-hour discounts on our most sought-after spiritual items. Stock is strictly limited.</p>
          
          <div className="flex items-center gap-6 bg-black/30 backdrop-blur px-8 py-4 rounded-2xl border border-white/10 shadow-xl">
            <div className="text-center">
              <span className="text-3xl font-bold font-mono text-white">{hours}</span>
              <span className="block text-[10px] uppercase tracking-widest text-primary-200 mt-1">Hours</span>
            </div>
            <span className="text-2xl font-bold text-accent animate-pulse">:</span>
            <div className="text-center">
              <span className="text-3xl font-bold font-mono text-white">{minutes}</span>
              <span className="block text-[10px] uppercase tracking-widest text-primary-200 mt-1">Mins</span>
            </div>
            <span className="text-2xl font-bold text-accent animate-pulse">:</span>
            <div className="text-center">
              <span className="text-3xl font-bold font-mono text-white">{seconds}</span>
              <span className="block text-[10px] uppercase tracking-widest text-primary-200 mt-1">Secs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Deals Content */}
      <div className="container mx-auto px-4 mt-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" /> Trending Now
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {deals.length === 0 ? (
            <div className="col-span-full py-20 text-center text-foreground/50">
              No active deals currently. Please check back later.
            </div>
          ) : deals.map((deal) => (
            <div key={deal.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-premium transition-all duration-300 border border-gray-100 flex flex-col sm:flex-row group relative">
              {/* Discount Badge */}
              <div className="absolute top-4 left-4 z-10 bg-red-600 text-white font-bold px-3 py-1.5 rounded-md shadow-lg flex items-center gap-1">
                <Zap className="w-4 h-4 fill-current" />
                {deal.original_price > deal.price ? Math.round((1 - deal.price / deal.original_price) * 100) : 0}% OFF
              </div>

              {/* Image */}
              <div className="sm:w-2/5 relative overflow-hidden bg-gray-50 h-64 sm:h-auto">
                <img src={deal.image || 'https://images.unsplash.com/photo-1618210343719-792f44c6806e?auto=format&fit=crop&q=80&w=800'} alt={deal.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <div className="flex items-center gap-1 text-white text-sm font-medium">
                    <Clock className="w-4 h-4" /> Ends soon
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="sm:w-3/5 p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-accent mb-2">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-medium text-foreground/80">{deal.rating || 5.0} <span className="text-foreground/50">({deal.reviews || 0} reviews)</span></span>
                  </div>
                  <a href={`/product/${deal.id}`} target="_blank" rel="noopener noreferrer">
                    <h3 className="text-xl font-display font-bold text-foreground mb-2 leading-tight group-hover:text-primary transition-colors">{deal.name}</h3>
                  </a>
                  <p className="text-sm text-foreground/60 mb-6 line-clamp-2">{deal.description}</p>
                </div>

                <div>
                  {/* Price */}
                  <div className="flex items-end gap-3 mb-4">
                    <span className="text-3xl font-bold text-foreground">₹{deal.price}</span>
                    <span className="text-lg text-foreground/40 line-through mb-1">₹{deal.original_price}</span>
                  </div>

                  {/* Claimed Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className={(deal.claimed || 50) > 80 ? 'text-red-500 font-bold' : 'text-foreground/70'}>
                        {deal.claimed || 50}% Claimed {(deal.claimed || 50) > 80 && '(Almost Sold Out!)'}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${(deal.claimed || 50) > 80 ? 'bg-red-500' : 'bg-primary'}`} 
                        style={{ width: `${deal.claimed || 50}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4">
                    <Link to="/cart" className="flex-1 bg-primary text-white text-center py-3.5 rounded-lg font-medium hover:bg-primary-600 transition-colors shadow-sm transform active:scale-95">
                      Claim Deal Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
