import { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, X, Move, Layers, Sparkles, ArrowUp, ArrowDown, Plus, Minus, SearchCode } from 'lucide-react';
import { Item } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { chat } from '../lib/llm';

export default function Mirror({ items }: { items: Item[] }) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [layerIds, setLayerIds] = useState<string[]>([]);
  const [scales, setScales] = useState<Record<string, number>>({});
  const [positions, setPositions] = useState<Record<string, { top: string, left: string, x: string, y: string }>>({});
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [isMirrorReady, setIsMirrorReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoAlign, setAutoAlign] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!autoAlign || layerIds.length === 0) return;
    const CATEGORY_ORDER: Record<string, number> = {
      'Dress': 1,
      'Bottom': 2,
      'Shoes': 3,
      'Top': 4,
      'Outerwear': 5,
      'Accessory': 6,
    };
    const sortedIds = [...layerIds].sort((a, b) => {
      const itemA = items.find(i => i.id === a);
      const itemB = items.find(i => i.id === b);
      return (CATEGORY_ORDER[itemA?.category || 'Top'] || 0) - (CATEGORY_ORDER[itemB?.category || 'Top'] || 0);
    });
    // Avoid resetting layerIds (and re-firing this effect) when already sorted.
    if (sortedIds.some((id, i) => id !== layerIds[i])) {
      setLayerIds(sortedIds);
    }
    setPositions(prev => {
      const next = { ...prev };
      sortedIds.forEach(id => {
        const item = items.find(i => i.id === id);
        if (!item) return;
        let top = '15%', left = '50%', x = '-50%', y = '0%';
        switch (item.category) {
          case 'Top': top = '15%'; break;
          case 'Outerwear': top = '12%'; break;
          case 'Bottom': top = '50%'; break;
          case 'Dress': top = '20%'; break;
          case 'Shoes': top = '80%'; break;
          case 'Accessory': top = '5%'; break;
        }
        next[id] = { top, left, x, y };
      });
      return next;
    });
    setScales(prev => {
      const next = { ...prev };
      sortedIds.forEach(id => {
        const item = items.find(i => i.id === id);
        if (!item) return;
        let scale = 1;
        switch (item.category) {
          case 'Top': scale = 1.1; break;
          case 'Outerwear': scale = 1.35; break;
          case 'Bottom': scale = 1.0; break;
          case 'Dress': scale = 1.25; break;
          case 'Shoes': scale = 0.6; break;
          case 'Accessory': scale = 0.5; break;
        }
        next[id] = scale;
      });
      return next;
    });
  }, [autoAlign, layerIds, items]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsMirrorReady(true);
      setError(null);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check your permissions.');
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const toggleLayer = (item: Item) => {
    if (layerIds.includes(item.id)) {
      setLayerIds(layerIds.filter(id => id !== item.id));
      if (activeLayerId === item.id) setActiveLayerId(null);
    } else {
      let top = '15%';
      let left = '50%';
      let x = '-50%';
      let y = '0%';
      let scale = 1;

      if (autoAlign) {
        switch (item.category) {
          case 'Top':
            top = '15%'; scale = 1.1;
            break;
          case 'Outerwear':
            top = '12%'; scale = 1.35;
            break;
          case 'Bottom':
            top = '50%'; scale = 1.0;
            break;
          case 'Dress':
            top = '20%'; scale = 1.25;
            break;
          case 'Shoes':
            top = '80%'; scale = 0.6;
            break;
          case 'Accessory':
            top = '5%'; scale = 0.5;
            break;
        }
      } else {
        left = '25%';
        x = '0%';
      }

      setPositions(prev => ({ ...prev, [item.id]: { top, left, x, y } }));
      setScales({ ...scales, [item.id]: scale });

      const newLayerIds = [...layerIds, item.id];
      if (autoAlign) {
        const CATEGORY_ORDER: Record<string, number> = {
          'Dress': 1,
          'Bottom': 2,
          'Shoes': 3,
          'Top': 4,
          'Outerwear': 5,
          'Accessory': 6,
        };
        newLayerIds.sort((a, b) => {
          const itemA = items.find(i => i.id === a);
          const itemB = items.find(i => i.id === b);
          return (CATEGORY_ORDER[itemA?.category || 'Top'] || 0) - (CATEGORY_ORDER[itemB?.category || 'Top'] || 0);
        });
      }

      setLayerIds(newLayerIds);
      setActiveLayerId(item.id);
    }
  };

  const analyzeLook = async () => {
    const layered = layerIds
      .map(id => items.find(i => i.id === id))
      .filter(Boolean) as Item[];
    if (layered.length === 0) {
      setAnalysisResult('Add at least one piece to the mirror first.');
      return;
    }
    setAnalysisLoading(true);
    setAnalysisResult(null);
    try {
      const list = layered
        .map(it => `- ${it.name} (${it.category}${it.color ? `, ${it.color}` : ''})`)
        .join('\n');
      const prompt = `You are Aether, a sophisticated AI stylist. The user has layered the following pieces on themselves in the virtual mirror:
${list}

Break down the color palette, name the season this works for (e.g. Autumn/Winter), and give one short chic style tip. Be extremely concise — 2-3 short sentences total.`;
      const reply = await chat([{ role: 'user', content: prompt }], { maxTokens: 200 });
      setAnalysisResult(reply || 'Unable to formulate an opinion.');
    } catch(e) {
      console.error(e);
      setAnalysisResult('The stylist connection fluttered. Try again.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const bringForward = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const idx = layerIds.indexOf(id);
    if (idx < layerIds.length - 1) {
      const newLayers = [...layerIds];
      const temp = newLayers[idx + 1];
      newLayers[idx + 1] = newLayers[idx];
      newLayers[idx] = temp;
      setLayerIds(newLayers);
    }
  };

  const sendBackward = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const idx = layerIds.indexOf(id);
    if (idx > 0) {
      const newLayers = [...layerIds];
      const temp = newLayers[idx - 1];
      newLayers[idx - 1] = newLayers[idx];
      newLayers[idx] = temp;
      setLayerIds(newLayers);
    }
  };

  const changeScale = (id: string, delta: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScales(prev => ({
      ...prev,
      [id]: Math.max(0.3, Math.min(3, (prev[id] || 1) + delta))
    }));
  };

  const removeLayer = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLayerIds(layerIds.filter(layerId => layerId !== id));
    if (activeLayerId === id) setActiveLayerId(null);
  };

  return (
    <div className="h-screen bg-cream-50 overflow-hidden relative flex flex-col md:flex-row">
      {/* Live Feed Area */}
      <div className="relative flex-1 bg-zinc-900 overflow-hidden shadow-inner">
        {/* Mirror Label */}
        <div className="absolute top-8 left-8 z-30 pointer-events-auto">
          <h2 className="text-[11px] uppercase tracking-[0.3em] text-white/50 mb-2 flex items-center gap-2 font-bold">
            <Sparkles className="w-4 h-4 text-rose-300" />
            Digital Atelier
          </h2>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/80 font-medium">Studio Mode</span>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setAutoAlign(!autoAlign)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all shadow-xl",
                autoAlign ? "bg-rose-500/20 border-rose-400 text-rose-300" : "bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:bg-zinc-800"
              )}
            >
              <Layers className="w-3 h-3" />
              Auto-Align
            </button>
            <button 
              onClick={analyzeLook}
              disabled={analysisLoading}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all shadow-xl disabled:opacity-50",
                "bg-zinc-800/80 border-rose-400 text-rose-300 hover:bg-rose-500 hover:text-white"
              )}
            >
              {analysisLoading ? <div className="w-3 h-3 rounded-full border-2 border-t-transparent border-rose-300 animate-spin" /> : <SearchCode className="w-3 h-3" />}
              Analyze Look
            </button>
          </div>
          
          <AnimatePresence>
            {analysisResult && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="mt-6 w-full max-w-sm bg-zinc-900/40 backdrop-blur-3xl border border-rose-200/30 p-6 rounded-[2rem] shadow-2xl relative pointer-events-auto"
               >
                 <button onClick={() => setAnalysisResult(null)} className="absolute top-4 right-4 text-zinc-400 hover:text-rose-400 transition-colors">
                   <X className="w-4 h-4" />
                 </button>
                 <h3 className="text-[10px] uppercase tracking-[0.3em] text-rose-300 mb-2 font-bold flex items-center gap-2">
                   <Sparkles className="w-3 h-3" /> Stylist Feedback
                 </h3>
                 <p className="text-zinc-200 text-sm font-light leading-relaxed italic">{analysisResult}</p>
               </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Video Background */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transition-opacity duration-1000"
          style={{ transform: 'scaleX(-1)' }}
        />
        
        {/* Subtle Overlay Filter for skin tone enhancement style */}
        <div className="absolute inset-0 bg-rose-500/5 mix-blend-soft-light pointer-events-none z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 via-transparent to-transparent pointer-events-none z-10" />

        {/* Overlay Canvas */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          <AnimatePresence>
            {layerIds.map((id, index) => {
              const selectedItem = items.find(i => i.id === id);
              if (!selectedItem) return null;
              const isActive = activeLayerId === id;
              const currentScale = scales[id] || 1;

              return (
                <motion.div
                  key={id}
                  drag
                  dragMomentum={false}
                  initial={{ opacity: 0, scale: 0.5, x: '0%', y: '0%' }}
                  animate={{ opacity: 1, scale: currentScale, x: positions[id]?.x || '-50%', y: positions[id]?.y || '0%' }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onPointerDown={() => setActiveLayerId(id)}
                  onDragEnd={(_, info) => {
                    if (!autoAlign) {
                      setPositions(prev => ({
                        ...prev,
                        [id]: {
                          ...prev[id],
                          // Note: framer-motion manages drag internally, actually updating x/y animate state might conflict,
                          // but to persist we can keep track or let Framer Motion handle it if we remove x/y from animate.
                        }
                      }));
                    }
                  }}
                  className={cn(
                    "absolute pointer-events-auto w-72 md:w-96 aspect-[3/4]",
                    isActive ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                  )}
                  style={{ left: positions[id]?.left || '50%', top: positions[id]?.top || '15%', zIndex: index }}
                >
                  <div className={cn("relative w-full h-full p-4 group transition-all duration-300", isActive ? "" : "opacity-80 hover:opacity-100")}>
                    <div className="absolute inset-4 -z-10 group-active:scale-105 transition-transform">
                       {/* Shadow/Glow under item */}
                       <div className={cn("w-full h-full bg-black/20 blur-3xl rounded-full transition-opacity", isActive ? "opacity-60" : "opacity-20")} />
                    </div>
                    <img 
                      src={selectedItem.imageUrl} 
                      alt={selectedItem.name} 
                      className={cn("w-full h-full object-contain filter transition-all", isActive ? "drop-shadow-[0_20px_50px_rgba(0,0,0,0.4)]" : "drop-shadow-[0_10px_20px_rgba(0,0,0,0.2)]")}
                      referrerPolicy="no-referrer"
                      draggable={false}
                    />
                    
                    {isActive && (
                      <div className="absolute inset-0 pointer-events-none border-2 border-rose-400/50 rounded-3xl animate-pulse"/>
                    )}

                    {isActive && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-4 shadow-xl border border-rose-100/50 pointer-events-auto transition-all">
                         <button onClick={(e) => sendBackward(id, e)} className="text-zinc-500 hover:text-rose-500 disabled:opacity-30" disabled={index === 0}>
                           <ArrowDown className="w-4 h-4" />
                         </button>
                         <button onClick={(e) => bringForward(id, e)} className="text-zinc-500 hover:text-rose-500 disabled:opacity-30" disabled={index === layerIds.length - 1}>
                           <ArrowUp className="w-4 h-4" />
                         </button>
                         <div className="w-[1px] h-4 bg-rose-100" />
                         <button onClick={(e) => changeScale(id, -0.1, e)} className="text-zinc-500 hover:text-rose-500">
                           <Minus className="w-4 h-4" />
                         </button>
                         <button onClick={(e) => changeScale(id, 0.1, e)} className="text-zinc-500 hover:text-rose-500">
                           <Plus className="w-4 h-4" />
                         </button>
                         <div className="w-[1px] h-4 bg-rose-100" />
                         <button onClick={(e) => removeLayer(id, e)} className="text-zinc-500 hover:text-red-500">
                           <X className="w-4 h-4" />
                         </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Camera Error / Placeholder */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center z-40 bg-zinc-950">
            <Camera className="w-20 h-20 text-zinc-800 mb-8" />
            <p className="text-zinc-500 font-serif italic text-xl mb-10">{error}</p>
            <button 
              onClick={startCamera}
              className="px-10 py-5 bg-white text-zinc-900 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-rose-50 transition-colors shadow-xl"
            >
              Retry Connection
            </button>
          </div>
        )}
      </div>

      {/* Item Picker Sidebar */}
      <div className="w-full md:w-96 bg-white border-t md:border-t-0 md:border-l border-rose-100 p-8 flex flex-col h-1/3 md:h-full z-30 shadow-2xl">
        <div className="mb-10">
          <h3 className="text-xs uppercase tracking-[0.3em] text-rose-400 mb-3 font-bold">Studio Layers</h3>
          <p className="text-zinc-400 text-sm font-light italic leading-relaxed">Select a piece from your boutique library to begin the fitting.</p>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
          {items.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-2 gap-4">
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => toggleLayer(item)}
                  className={cn(
                    "aspect-[3/4] rounded-2xl overflow-hidden border transition-all relative group shadow-sm",
                    layerIds.includes(item.id) ? "ring-2 ring-rose-400 ring-offset-4" : "border-rose-50 hover:border-rose-200"
                  )}
                >
                  <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                     <span className="text-[9px] uppercase tracking-tighter font-bold text-rose-500">{item.name}</span>
                  </div>
                  {layerIds.includes(item.id) && (
                    <div className="absolute top-2 right-2 flex items-center justify-center">
                      <div className="w-5 h-5 bg-rose-400 rounded-full flex items-center justify-center shadow-lg text-white font-bold text-[10px]">
                        {layerIds.indexOf(item.id) + 1}
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center">
                 <RefreshCw className="w-8 h-8 text-rose-200" />
              </div>
              <p className="text-zinc-400 text-sm italic font-light">Your private collection is currently empty.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
