import { useState, useEffect } from 'react';
import { Sparkles, Cloud, Sun, CloudRain, Thermometer, ArrowRight, Shirt, Clock } from 'lucide-react';
import { stylistService } from '../services/stylist';
import { wardrobeService } from '../services/wardrobe';
import { Item, Outfit } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Dashboard({ items, onNavigate, userId }: { items: Item[], onNavigate: (tab: any) => void, userId: string }) {
  const [weather, setWeather] = useState<{ temp: number, status: string } | null>(null);
  const [dailySuggestion, setDailySuggestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pastOutfits, setPastOutfits] = useState<Outfit[]>([]);

  useEffect(() => {
    const unsub = wardrobeService.subscribeToOutfits(userId, (outfits) => {
      setPastOutfits(outfits);
    });
    return () => unsub();
  }, [userId]);

  const [weatherLoading, setWeatherLoading] = useState(true);

  useEffect(() => {
    async function fetchWeatherAndStyle() {
      setLoading(true);
      setWeatherLoading(true);

      const handleFallback = async () => {
        const mockWeather = { temp: 22, status: 'Sunny Spells' };
        setWeather(mockWeather);
        await getStyle(mockWeather);
        setLoading(false);
        setWeatherLoading(false);
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`);
            const data = await res.json();
            
            // Map basic WMO weather codes to string
            let status = 'Clear';
            const code = data.current.weather_code;
            if (code >= 1 && code <= 3) status = 'Partly Cloudy';
            if (code >= 45 && code <= 48) status = 'Foggy';
            if (code >= 51 && code <= 67) status = 'Rainy';
            if (code >= 71 && code <= 77) status = 'Snowy';
            if (code >= 95) status = 'Thunderstorm';

            const realWeather = { temp: Math.round(data.current.temperature_2m), status };
            setWeather(realWeather);
            await getStyle(realWeather);
          } catch(e) {
             console.error(e);
             handleFallback();
          } finally {
            setLoading(false);
            setWeatherLoading(false);
          }
        }, () => handleFallback());
      } else {
        handleFallback();
      }
    }
    
    async function getStyle(currentWeather: { temp: number, status: string }) {
      if (items.length > 0) {
        const suggestion = await stylistService.getOutfitSuggestions(
          items, 
          'a general outing', 
          `${currentWeather.temp}°C and ${currentWeather.status}`
        );
        if (suggestion && suggestion.length > 0) {
          setDailySuggestion(suggestion[0]);
        }
      }
    }

    fetchWeatherAndStyle();
  }, [items]);

  return (
    <div className="p-6 md:p-12 min-h-screen bg-cream-50 text-zinc-900">
      <header className="mb-16">
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-11px uppercase tracking-[0.3em] text-rose-400 mb-2 font-medium"
        >
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl font-serif tracking-tight text-zinc-900 shadow-rose-200/20"
        >
          Daily Inspiration
        </motion.h1>
      </header>

      <div className="grid lg:grid-cols-[1.6fr,1fr] gap-10">
        <motion.section 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-rose-100 rounded-[3rem] p-8 md:p-14 relative overflow-hidden shadow-sm shadow-rose-200/10 group"
        >
          <div className="absolute -top-12 -right-12 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-1000 rotate-12">
            <Sparkles className="w-64 h-64 text-rose-500" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-10">
              <div className="px-5 py-2.5 bg-rose-50 rounded-full border border-rose-100 flex items-center gap-3">
                <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-xs font-medium text-rose-600 tracking-wide">{weatherLoading ? '...' : weather?.temp}°C</span>
              </div>
              <div className="px-5 py-2.5 bg-rose-50 rounded-full border border-rose-100 flex items-center gap-3">
                <Cloud className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-xs font-medium text-rose-600 tracking-wide">{weatherLoading ? 'Checking skies...' : weather?.status}</span>
              </div>
            </div>

            {loading ? (
              <div className="space-y-6">
                <div className="h-12 w-80 bg-rose-50 animate-pulse rounded-2xl" />
                <div className="h-28 w-full bg-rose-50 animate-pulse rounded-3xl" />
              </div>
            ) : dailySuggestion ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-10"
              >
                <div>
                  <h3 className="text-4xl font-serif mb-6 text-zinc-900">{dailySuggestion.name}</h3>
                  <p className="text-zinc-500 font-light leading-relaxed max-w-xl italic text-lg opacity-80 decoration-rose-100">
                    "{dailySuggestion.explanation}"
                  </p>
                </div>

                <div className="flex flex-wrap gap-6">
                  {dailySuggestion.items.map((item: Item, i: number) => (
                    <motion.div 
                      key={item.id} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="w-28 space-y-3 group/item"
                    >
                      <div className="aspect-[4/5] bg-rose-50 rounded-2xl overflow-hidden border border-rose-100 shadow-sm transition-all duration-500 group-hover/item:scale-105 group-hover/item:-rotate-2">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-all" referrerPolicy="no-referrer" />
                      </div>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-widest text-center truncate">{item.name}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="py-24 text-center border-2 border-dashed border-rose-100 rounded-[2rem]">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Shirt className="w-8 h-8 text-rose-300" />
                </div>
                <p className="text-zinc-400 font-light italic">Your wardrobe awaits its first treasure.</p>
              </div>
            )}
          </div>
        </motion.section>

        <div className="space-y-6">
           <motion.button 
             whileHover={{ y: -5 }}
             onClick={() => onNavigate('stylist')}
             className="w-full bg-zinc-900 text-cream-50 p-10 rounded-[3rem] text-left group transition-all shadow-xl shadow-zinc-900/10 active:scale-[0.98]"
           >
             <Sparkles className="w-10 h-10 mb-6 text-rose-300" />
             <h3 className="text-2xl font-serif mb-3">Occasion Styling</h3>
             <p className="text-zinc-400 text-base font-light opacity-80">Date night or gala? Let AI curate your perfect ensemble.</p>
             <div className="mt-8 flex items-center gap-2 text-rose-300 text-sm font-medium">
                <span>Start styling</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
             </div>
           </motion.button>

           <motion.button 
             whileHover={{ y: -5 }}
             onClick={() => onNavigate('wardrobe')}
             className="w-full border border-rose-100 bg-white p-10 rounded-[3rem] text-left group transition-all shadow-sm active:scale-[0.98]"
           >
             <Shirt className="w-10 h-10 mb-6 text-rose-200" />
             <h3 className="text-2xl font-serif mb-3 text-zinc-800">Your Closet</h3>
             <p className="text-zinc-500 text-base font-light">Add new pieces or organize your curated collection.</p>
           </motion.button>
        </div>
      </div>

      {/* Past Outfits Section */}
      <div className="mt-20">
        <div className="flex items-center gap-4 mb-10">
           <h2 className="text-3xl font-serif text-zinc-900">Archived Looks</h2>
           <div className="h-px bg-rose-100 flex-1 ml-4" />
        </div>
        
        {pastOutfits.length === 0 ? (
           <div className="py-16 text-center border border-rose-100 rounded-[3rem] bg-white/50">
             <Clock className="w-10 h-10 text-rose-200 mx-auto mb-4" />
             <p className="text-zinc-400 font-light italic">Your saved styling sessions will appear here.</p>
           </div>
        ) : (
           <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
             {pastOutfits.map((outfit) => {
                const outfitItems = items.filter(i => outfit.itemIds.includes(i.id));
                return (
                  <motion.div 
                    key={outfit.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-rose-100 rounded-[2.5rem] p-8 hover:shadow-lg hover:shadow-rose-100/30 transition-all duration-500 group"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-xl font-serif text-zinc-900 mb-1">{outfit.name}</h3>
                        <p className="text-xs text-rose-400 uppercase tracking-widest font-bold">{outfit.occasion}</p>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-medium">
                        {new Date(outfit.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                      </span>
                    </div>
                    
                    <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                      {outfitItems.map(item => (
                        <div key={item.id} className="min-w-[80px] max-w-[80px]">
                           <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-rose-50 bg-rose-50/50">
                             <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
                           </div>
                        </div>
                      ))}
                    </div>
                    
                    {outfit.aiSuggestion && (
                       <p className="text-sm text-zinc-500 italic font-light line-clamp-2 mt-2 decoration-rose-100">"{outfit.aiSuggestion}"</p>
                    )}
                  </motion.div>
                );
             })}
           </div>
        )}
      </div>
    </div>
  );
}
