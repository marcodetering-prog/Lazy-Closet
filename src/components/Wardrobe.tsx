import { 
  Plus, 
  Search, 
  Sparkles, 
  Shirt, 
  Trash2, 
  Camera, 
  X,
  PlusCircle,
  Upload,
  Link as LinkIcon
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { wardrobeService } from '../services/wardrobe';
import { Item, Category } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { chatJson } from '../lib/llm';


const CATEGORIES: Category[] = ['Top', 'Bottom', 'Dress', 'Outerwear', 'Shoes', 'Accessory'];

export default function Wardrobe({ userId }: { userId: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<Category | 'All'>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = wardrobeService.subscribeToItems(userId, (newItems) => {
      setItems(newItems);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId]);

  const filteredItems = filter === 'All' ? items : items.filter(i => i.category === filter);

  return (
    <div className="p-6 md:p-12 min-h-screen bg-cream-50 text-zinc-900">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="text-11px uppercase tracking-[0.4em] text-rose-400 mb-3 font-semibold">Curation</h2>
          <h1 className="text-6xl font-serif tracking-tight text-zinc-950">Your Wardrobe</h1>
        </motion.div>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-3 bg-zinc-900 text-cream-50 px-8 py-4 rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-900/10"
        >
          <PlusCircle className="w-5 h-5 text-rose-300" />
          <span>Add New Piece</span>
        </motion.button>
      </header>

      {/* Filter Bar */}
      <nav className="flex gap-8 mb-16 overflow-x-auto pb-4 no-scrollbar border-b border-rose-100">
        <button 
          onClick={() => setFilter('All')}
          className={cn(
            "text-sm tracking-widest transition-all pb-4 border-b-2 font-medium uppercase text-[10px]",
            filter === 'All' ? "border-rose-400 text-rose-500" : "border-transparent text-zinc-400 hover:text-rose-300"
          )}
        >
          Signature All
        </button>
        {CATEGORIES.map(cat => (
          <button 
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              "text-sm tracking-widest transition-all pb-4 border-b-2 whitespace-nowrap font-medium uppercase text-[10px]",
              filter === cat ? "border-rose-400 text-rose-500" : "border-transparent text-zinc-400 hover:text-rose-300"
            )}
          >
            {cat}s
          </button>
        ))}
      </nav>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-rose-50/50 animate-pulse rounded-[2rem] border border-rose-100/50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                onClick={() => setSelectedItem(item)}
                className="group relative aspect-[3/4] rounded-[2rem] overflow-hidden bg-white border border-rose-100 shadow-sm hover:shadow-xl hover:shadow-rose-100/40 transition-all duration-500 cursor-pointer"
              >
                <img 
                  src={item.imageUrl} 
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6">
                  <motion.div
                    initial={{ y: 20 }}
                    whileHover={{ y: 0 }}
                    className="space-y-1"
                  >
                    <p className="text-zinc-900 text-base font-serif truncate">{item.name}</p>
                    <p className="text-rose-400 text-[10px] uppercase tracking-widest font-bold">{item.category}</p>
                  </motion.div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      wardrobeService.deleteItem(item.id);
                    }}
                    className="absolute top-6 right-6 p-3 bg-white/80 backdrop-blur-md rounded-full text-zinc-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredItems.length === 0 && (
            <div className="col-span-full py-40 text-center">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <Shirt className="w-10 h-10 text-rose-200" />
              </div>
              <p className="text-zinc-400 font-light italic text-lg tracking-wide">Select your first piece to begin your digital collection.</p>
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <AddItemModal 
            userId={userId} 
            onClose={() => setIsAddModalOpen(false)} 
          />
        )}
        {selectedItem && (
          <ItemDetailModal 
            item={selectedItem} 
            allItems={items}
            onClose={() => setSelectedItem(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ItemDetailModal({ item, allItems, onClose }: { item: Item, allItems: Item[], onClose: () => void }) {
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchedItems, setMatchedItems] = useState<Item[] | null>(null);
  const [styleAdvice, setStyleAdvice] = useState<string | null>(null);

  const getMatches = async () => {
    setMatchLoading(true);
    setMatchedItems(null);
    try {
      const otherItems = allItems.filter(i => i.id !== item.id);
      const itemsSummary = otherItems.map(i => `- ${i.name} (Category: ${i.category}, ID: ${i.id})`).join('\n');
      
      const prompt = `I have a piece of clothing: "${item.name}" (Category: ${item.category}).
Please analyze this item and select up to 3 complementary items from my wardrobe that would create a stylish, color-coordinated outfit.
Wardrobe:
${itemsSummary}

Respond exactly as JSON with two keys:
1. "itemIds": an array of strings representing the IDs of the matched items.
2. "advice": a short 1-sentence chic styling tip on why these work together.`;

      const json = await chatJson<{ itemIds?: string[]; advice?: string }>(
        [{ role: 'user', content: prompt }],
        { maxTokens: 300 }
      );
      if (json?.itemIds) {
        const matches = json.itemIds
          .map((id: string) => allItems.find(i => i.id === id))
          .filter(Boolean) as Item[];
        setMatchedItems(matches);
      }
      if (json?.advice) setStyleAdvice(json.advice);
    } catch(e) {
      console.error("Match failed", e);
    } finally {
      setMatchLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-zinc-900/30 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        className="relative w-full max-w-2xl bg-white border border-rose-100 rounded-[3rem] p-10 shadow-2xl overflow-hidden flex flex-col md:flex-row gap-10"
      >
        <button onClick={onClose} className="absolute top-8 right-8 text-zinc-300 hover:text-rose-400 transition-colors z-10">
          <X className="w-7 h-7" />
        </button>

        <div className="w-full md:w-1/2 aspect-[4/5] rounded-[2rem] overflow-hidden bg-rose-50 border border-rose-100 shrink-0">
           <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>

        <div className="flex-1 flex flex-col pt-4">
           <h2 className="text-sm text-rose-400 font-bold uppercase tracking-[0.3em] mb-2">{item.category}</h2>
           <h1 className="text-3xl font-serif text-zinc-900 mb-8">{item.name}</h1>

           {!matchedItems ? (
             <div className="mt-auto">
               <button 
                 onClick={getMatches}
                 disabled={matchLoading}
                 className="flex items-center gap-3 bg-zinc-900 text-cream-50 px-8 py-4 rounded-full text-sm font-medium hover:bg-zinc-800 transition-all shadow-lg w-full justify-center disabled:opacity-50"
               >
                 {matchLoading ? (
                   <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" /> Pairing Colors...</span>
                 ) : (
                   <><Sparkles className="w-4 h-4" /> Find Matching Pairs</>
                 )}
               </button>
             </div>
           ) : (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col">
                <h3 className="text-xs uppercase tracking-widest text-zinc-400 font-bold mb-4">Curated Matches</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                  {matchedItems.length > 0 ? matchedItems.map(m => (
                    <div key={m.id} className="min-w-[80px] w-20">
                      <div className="aspect-[4/5] rounded-xl overflow-hidden bg-rose-50 border border-rose-100 mb-2">
                        <img src={m.imageUrl} alt={m.name} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-[9px] text-zinc-500 uppercase tracking-wider text-center truncate">{m.name}</p>
                    </div>
                  )) : (
                    <p className="text-sm font-light text-zinc-400 italic">No perfect matches found in current wardrobe.</p>
                  )}
                </div>
                {styleAdvice && (
                   <div className="mt-auto bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                     <p className="text-xs text-rose-900 font-light italic leading-relaxed">"{styleAdvice}"</p>
                   </div>
                )}
             </motion.div>
           )}
        </div>
      </motion.div>
    </div>
  );
}

function AddItemModal({ userId, onClose }: { userId: string, onClose: () => void }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Top');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('upload');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Vision-based auto-fill is disabled while the LLM proxy is text-only
  // (DeepSeek). The user fills in name + category manually.
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !imageUrl) return;
    
    setIsSubmitting(true);
    try {
      await wardrobeService.addItem({
        name,
        category,
        imageUrl,
        ownerId: userId,
        tags: [],
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-zinc-900/30 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        className="relative w-full max-w-lg bg-white border border-rose-100 rounded-[3rem] p-10 md:p-14 shadow-2xl shadow-rose-200/20"
      >
        <button onClick={onClose} className="absolute top-10 right-10 text-zinc-300 hover:text-rose-400 transition-colors">
          <X className="w-7 h-7" />
        </button>

        <h2 className="text-4xl font-serif mb-10 text-zinc-900">Add to Curation</h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.2em] text-rose-400 ml-1 font-bold">Piece Name</label>
            <input 
              required
              className="w-full bg-rose-50/30 border border-rose-100 rounded-2xl px-6 py-4 text-zinc-900 focus:outline-none focus:border-rose-300 focus:bg-white transition-all placeholder:text-zinc-300"
              placeholder="e.g. Vintage Silk Blouse"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.2em] text-rose-400 ml-1 font-bold">Category</label>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "px-4 py-3 rounded-xl text-xs uppercase tracking-widest transition-all border font-semibold",
                    category === cat ? "bg-zinc-900 text-cream-50 border-zinc-900 shadow-md" : "bg-white text-zinc-400 border-rose-100 hover:border-rose-300 hover:text-rose-400"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[10px] uppercase tracking-[0.2em] text-rose-400 font-bold">Image Source</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setImageMode('upload')} className={cn("text-xs font-medium px-2 py-1 rounded transition-colors", imageMode === 'upload' ? "bg-rose-100 text-rose-600" : "text-zinc-400 hover:bg-rose-50")}>Upload</button>
                <button type="button" onClick={() => setImageMode('url')} className={cn("text-xs font-medium px-2 py-1 rounded transition-colors", imageMode === 'url' ? "bg-rose-100 text-rose-600" : "text-zinc-400 hover:bg-rose-50")}>Link</button>
              </div>
            </div>

            {imageMode === 'url' ? (
              <input 
                required
                className="w-full bg-rose-50/30 border border-rose-100 rounded-2xl px-6 py-4 text-zinc-900 focus:outline-none focus:border-rose-300 focus:bg-white transition-all placeholder:text-zinc-400"
                placeholder="Paste image URL here"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            ) : (
              <div className="flex gap-4 w-full">
                <input 
                  type="file" 
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <input 
                  type="file" 
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  ref={cameraInputRef}
                  onChange={handleFileUpload}
                />
                
                {imageUrl && !imageUrl.startsWith('http') ? (
                  <div className="relative w-full h-32 rounded-2xl border border-rose-100 overflow-hidden group">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <button type="button" onClick={() => {
                           setImageUrl('');
                           setName('');
                       }} className="bg-white/90 p-2 rounded-full text-rose-500 hover:bg-white hover:scale-105 transition-all">
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4 w-full">
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 bg-rose-50/50 border border-rose-100 border-dashed rounded-2xl py-6 flex flex-col items-center justify-center gap-2 hover:bg-rose-50 transition-colors text-zinc-500 hover:text-rose-500"
                    >
                      <Upload className="w-5 h-5" />
                      <span className="text-xs font-medium">Upload File</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex-1 bg-rose-50/50 border border-rose-100 border-dashed rounded-2xl py-6 flex flex-col items-center justify-center gap-2 hover:bg-rose-50 transition-colors text-zinc-500 hover:text-rose-500"
                    >
                      <Camera className="w-5 h-5" />
                      <span className="text-xs font-medium">Take Photo</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button 
            disabled={isSubmitting}
            className="w-full bg-zinc-900 text-cream-50 py-5 rounded-2xl font-medium tracking-tight mt-6 hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/20 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-3"
          >
            <Sparkles className="w-5 h-5 text-rose-300" />
            <span>{isSubmitting ? 'Curating...' : 'Finish Curation'}</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
}
