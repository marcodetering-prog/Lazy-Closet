import { useState } from 'react';
import { Sparkles, MapPin, CloudSun, ArrowRight, Loader2, Shirt } from 'lucide-react';
import { stylistService } from '../services/stylist';
import { Item } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

import { wardrobeService } from '../services/wardrobe';

export default function AIPressed({ items, userId }: { items: Item[], userId: string }) {
  const [occasion, setOccasion] = useState('');
  const [weather, setWeather] = useState('');
  const [suggestions, setSuggestions] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [savedOutfits, setSavedOutfits] = useState<Set<number>>(new Set());

  const handleGetSuggestions = async () => {
    if (!occasion) return;
    setLoading(true);
    setSavedOutfits(new Set());
    const result = await stylistService.getOutfitSuggestions(items, occasion, weather);
    setSuggestions(result);
    setLoading(false);
  };

  const handleSaveOutfit = async (index: number) => {
    if (!suggestions) return;
    const outfit = suggestions[index];
    setSavingIdx(index);
    try {
      await wardrobeService.addOutfit({
        name: outfit.name,
        itemIds: outfit.items.map((i: Item) => i.id),
        ownerId: userId,
        occasion: occasion,
        weatherType: weather,
        aiSuggestion: outfit.explanation,
      });
      setSavedOutfits(prev => new Set(prev).add(index));
    } catch (e) {
      console.error(e);
    }
    setSavingIdx(null);
  };

  const occasionPresets = ['Date Night', 'Business Meeting', 'Casual Weekend', 'Wedding Guest', 'Gym Session'];

  return (
    <div className="p-6 md:p-12 min-h-screen bg-cream-50 text-zinc-900">
      <header className="mb-16">
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-11px uppercase tracking-[0.3em] text-rose-400 mb-4 flex items-center gap-2 font-bold"
        >
          <Sparkles className="w-4 h-4" />
          AI Designer
        </motion.h2>
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl font-serif tracking-tight max-w-2xl leading-[1.1]"
        >
          Curate the perfect look for your next event.
        </motion.h1>
      </header>

      <div className="grid lg:grid-cols-[1fr,1.5fr] gap-16">
        {/* Controls */}
        <div className="space-y-12">
          <section className="space-y-10">
            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 block ml-1 font-bold">Where are you going?</label>
              <input 
                className="w-full bg-white border border-rose-100 rounded-[2rem] px-8 py-6 text-lg focus:outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-50 transition-all placeholder:text-zinc-300 shadow-sm"
                placeholder="e.g. Vintage Garden Party..."
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
              />
              <div className="flex flex-wrap gap-3 mt-4">
                {occasionPresets.map(preset => (
                  <button 
                    key={preset}
                    onClick={() => setOccasion(preset)}
                    className={cn(
                      "px-6 py-2.5 rounded-full text-[10px] uppercase tracking-widest border transition-all font-bold",
                      occasion === preset ? "bg-zinc-900 text-cream-50 border-zinc-900 shadow-md" : "bg-white text-zinc-400 border-rose-100 hover:border-rose-300 hover:text-rose-400 shadow-sm"
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 block flex items-center gap-2 ml-1 font-bold">
                <CloudSun className="w-4 h-4 text-rose-300" />
                Atmosphere (Weather/Vibe)
              </label>
              <input 
                className="w-full bg-white border border-rose-100 rounded-[2rem] px-8 py-6 text-lg focus:outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-50 transition-all placeholder:text-zinc-300 shadow-sm"
                placeholder="e.g. Warm and golden"
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
              />
            </div>

            <button 
              disabled={loading || !occasion || items.length === 0}
              onClick={handleGetSuggestions}
              className="w-full group bg-zinc-900 text-cream-50 py-7 rounded-[2rem] font-medium tracking-tight flex items-center justify-center gap-4 transition-all hover:bg-zinc-800 disabled:opacity-30 active:scale-[0.98] shadow-2xl shadow-zinc-900/20"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span className="text-lg">Consult Private Stylist</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
                </>
              )}
            </button>
            {items.length === 0 && (
              <p className="text-[10px] text-rose-400 text-center uppercase tracking-[0.3em] font-bold">Please curate your wardrobe first</p>
            )}
          </section>
        </div>

        {/* Results */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-32 text-center"
              >
                <div className="relative w-32 h-32 mb-10">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-t-2 border-rose-200"
                  />
                  <Sparkles className="absolute inset-0 m-auto w-10 h-10 text-rose-400 animate-pulse" />
                </div>
                <p className="text-zinc-400 font-serif italic text-xl">Curating your signature look...</p>
              </motion.div>
            ) : suggestions ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-16"
              >
                {suggestions.map((outfit, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15, duration: 0.6 }}
                    className="group border border-rose-100 rounded-[3rem] bg-white p-10 hover:shadow-2xl hover:shadow-rose-100/30 transition-all duration-700"
                  >
                    <div className="flex justify-between items-start mb-10">
                      <div>
                        <h3 className="text-3xl font-serif mb-4 text-zinc-900">{outfit.name}</h3>
                        <p className="text-zinc-500 text-base leading-relaxed max-w-md font-light italic">"{outfit.explanation}"</p>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <span className="text-[10px] uppercase tracking-[0.2em] bg-rose-50 text-rose-500 font-bold px-5 py-2 rounded-full border border-rose-100 shadow-sm whitespace-nowrap">Look {i + 1}</span>
                        <button
                          onClick={() => handleSaveOutfit(i)}
                          disabled={savingIdx === i || savedOutfits.has(i)}
                          className={cn(
                            "text-[10px] uppercase tracking-[0.2em] font-bold px-5 py-2 rounded-full border transition-all whitespace-nowrap outline-none",
                            savedOutfits.has(i) 
                              ? "bg-emerald-50 text-emerald-500 border-emerald-100 opacity-80" 
                              : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 cursor-pointer shadow-sm active:scale-95"
                          )}
                        >
                          {savingIdx === i ? 'Saving...' : savedOutfits.has(i) ? 'Saved' : 'Save'}
                        </button>
                      </div>
                    </div>
 
                    <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar">
                      {outfit.items.map((item: Item, idx: number) => (
                        <motion.div 
                          key={item.id} 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          className="min-w-[140px] max-w-[140px] space-y-4 group/item"
                        >
                          <div className="aspect-[4/5] rounded-[2rem] overflow-hidden bg-rose-50 border border-rose-100 shadow-sm transition-all duration-500 group-hover/item:scale-105 group-hover/item:-rotate-2">
                            <img 
                              src={item.imageUrl} 
                              alt={item.name} 
                              className="w-full h-full object-cover transition-transform duration-700"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <p className="text-[9px] uppercase tracking-widest text-zinc-400 truncate text-center font-bold px-2">{item.name}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="border-2 border-rose-100 border-dashed rounded-[3rem] h-full min-h-[500px] flex flex-col items-center justify-center p-16 text-center bg-white/40">
                <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-10 border border-rose-100 shadow-sm">
                   <Sparkles className="w-10 h-10 text-rose-300" />
                </div>
                <h3 className="text-2xl font-serif mb-4 text-zinc-800">Ready for a Transformation?</h3>
                <p className="text-zinc-500 font-light italic text-lg max-w-sm">Share your destination, and our boutique AI will reveal the treasures in your collection.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
