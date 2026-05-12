import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Shirt, Sparkles, User as UserIcon, LogOut, Home, Camera } from 'lucide-react';
import AuthWrapper from './components/AuthWrapper';
import Wardrobe from './components/Wardrobe';
import AIPressed from './components/AIPressed';
import Dashboard from './components/Dashboard';
import Mirror from './components/Mirror';
import VoiceAssistant from './components/VoiceAssistant';
import { wardrobeService } from './services/wardrobe';
import { Item } from './types';
import { getFbAuth } from './lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

type Tab = 'home' | 'wardrobe' | 'stylist' | 'mirror' | 'profile';

export default function App() {
  return (
    <AuthWrapper>
      {(user) => <MainApp user={user} />}
    </AuthWrapper>
  );
}

function MainApp({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const unsubscribe = wardrobeService.subscribeToItems(user.uid, (newItems) => {
      setItems(newItems);
    });
    return () => unsubscribe();
  }, [user.uid]);

  const handleLogout = () => {
    const auth = getFbAuth();
    auth?.signOut();
  };

  return (
    <div className="min-h-screen bg-cream-50 text-zinc-900 font-sans selection:bg-rose-100">
      {/* Voice Assistant */}
        <VoiceAssistant 
          items={items}
          onNavigate={(tab) => setActiveTab(tab)} 
          onSearch={(query) => {
            console.log('Voice search for:', query);
            setActiveTab('wardrobe');
          }}
        />

      {/* Sidebar Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:right-auto md:w-24 md:h-full bg-white/80 backdrop-blur-xl border-t md:border-t-0 md:border-r border-rose-100 z-40 flex md:flex-col items-center justify-around md:justify-center gap-8 py-4 md:py-12">
        <div className="hidden md:block mb-auto">
          <motion.div 
            whileHover={{ rotate: 15 }}
            className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center border border-rose-200 shadow-sm"
          >
            <Shirt className="text-rose-500 w-6 h-6" />
          </motion.div>
        </div>

        <NavButton 
          active={activeTab === 'home'} 
          onClick={() => setActiveTab('home')}
          icon={<Home className="w-6 h-6" />}
          label="Home"
        />

        <NavButton 
          active={activeTab === 'wardrobe'} 
          onClick={() => setActiveTab('wardrobe')}
          icon={<Shirt className="w-6 h-6" />}
          label="Closet"
        />

        <NavButton 
          active={activeTab === 'stylist'} 
          onClick={() => setActiveTab('stylist')}
          icon={<Sparkles className="w-6 h-6" />}
          label="Stylist"
        />

        <NavButton 
          active={activeTab === 'mirror'} 
          onClick={() => setActiveTab('mirror')}
          icon={<Camera className="w-6 h-6" />}
          label="Mirror"
        />

        <NavButton 
          active={activeTab === 'profile'} 
          onClick={() => setActiveTab('profile')}
          icon={<UserIcon className="w-6 h-6" />}
          label="Me"
        />

        <button 
          onClick={handleLogout}
          className="hidden md:flex mt-auto text-zinc-400 hover:text-rose-500 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </nav>

      {/* Main Content */}
      <main className="pb-24 md:pb-0 md:pl-24">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Dashboard items={items} onNavigate={(tab) => setActiveTab(tab)} userId={user.uid} />
            </motion.div>
          )}
          {activeTab === 'wardrobe' && (
            <motion.div 
              key="wardrobe"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Wardrobe userId={user.uid} />
            </motion.div>
          )}
          {activeTab === 'stylist' && (
            <motion.div 
              key="stylist"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <AIPressed items={items} userId={user.uid} />
            </motion.div>
          )}
          {activeTab === 'mirror' && (
            <motion.div 
              key="mirror"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Mirror items={items} />
            </motion.div>
          )}
          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4 }}
              className="p-12 min-h-screen flex flex-col items-center justify-center text-center"
            >
              <div className="w-32 h-32 rounded-full overflow-hidden mb-8 ring-4 ring-rose-100 p-1 bg-white shadow-xl">
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                  alt={user.displayName || 'User'} 
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h2 className="text-4xl font-serif text-zinc-900 mb-2">{user.displayName}</h2>
              <p className="text-zinc-500 font-light tracking-wide mb-12">{user.email}</p>
              
              <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
                <div className="p-8 rounded-[2rem] bg-white border border-rose-100 shadow-sm">
                  <p className="text-3xl font-serif text-rose-500">{items.length}</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 mt-2">Treasures</p>
                </div>
                <div className="p-8 rounded-[2rem] bg-white border border-rose-100 shadow-sm">
                  <p className="text-3xl font-serif text-rose-500">Gold</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 mt-2">Status</p>
                </div>
              </div>

              <button 
                onClick={handleLogout}
                className="mt-12 flex items-center gap-3 text-rose-500 text-sm font-medium border border-rose-200 px-10 py-4 rounded-full bg-white hover:bg-rose-50 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-1 transition-all group py-2 px-4",
        active ? "text-rose-500" : "text-zinc-400 hover:text-rose-400"
      )}
    >
      <div className={cn(
        "transition-transform duration-300",
        active ? "scale-110" : "group-hover:scale-110"
      )}>
        {icon}
      </div>
      <span className="text-[9px] uppercase tracking-widest mt-1">
        {label}
      </span>
      {active && (
        <motion.div 
          layoutId="nav-active"
          className="absolute inset-0 bg-rose-50/50 rounded-2xl -z-10 border border-rose-100/50"
        />
      )}
    </button>
  );
}
