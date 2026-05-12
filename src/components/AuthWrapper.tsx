import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getFbAuth, signInWithGoogle } from '../lib/firebase';
import { LogIn, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function AuthWrapper({ children }: { children: (user: User) => React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [guestMode, setGuestMode] = useState(false);

  useEffect(() => {
    const auth = getFbAuth();
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Sparkles className="w-12 h-12 text-rose-300 opacity-50" />
        </motion.div>
      </div>
    );
  }

  if (!getFbAuth() && !guestMode) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6 text-center">
        <Sparkles className="w-12 h-12 text-rose-300 mb-6 animate-pulse" />
        <h1 className="text-5xl font-serif text-zinc-900 mb-4">Aether</h1>
        <p className="text-zinc-500 max-w-sm mb-8 font-light text-lg">
          We encountered a connection issue. You can still step into the boutique in offline mode.
        </p>
        <button
          onClick={() => setGuestMode(true)}
          className="btn-primary mb-6"
        >
          Enter Anonymous Session
        </button>
        <div className="p-4 bg-white rounded-2xl border border-rose-100 shadow-sm text-[10px] text-rose-400 uppercase tracking-widest font-bold">
          Offline Mode
        </div>
      </div>
    );
  }

  if (guestMode) {
    return <>{children({ uid: 'guest-user', displayName: 'Guest', email: 'guest@example.com', photoURL: null } as User)}</>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-100/40 via-transparent to-transparent pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center z-10"
        >
          <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-rose-200/20 border border-rose-50 rotate-3">
             <Sparkles className="w-12 h-12 text-rose-400" />
          </div>
          <h1 className="text-7xl md:text-8xl font-serif text-zinc-900 mb-6 tracking-tight">Aether</h1>
          <p className="text-zinc-500 font-light text-lg md:text-xl tracking-wide mb-14 max-w-md mx-auto italic">
            Your personal digital atelier and AI stylist for effortless elegance.
          </p>
          
          <button
            onClick={() => signInWithGoogle().catch(console.error)}
            className="group relative flex items-center justify-center gap-3 w-full max-w-xs mx-auto bg-zinc-900 text-cream-50 px-8 py-5 rounded-[2rem] font-medium transition-all hover:bg-zinc-800 active:scale-95 shadow-2xl shadow-zinc-900/20"
          >
            <span className="text-lg">Enter Studio</span>
            <LogIn className="w-5 h-5 transition-transform group-hover:translate-x-1 text-rose-300" />
          </button>
        </motion.div>
      </div>
    );
  }

  return <>{children(user)}</>;
}
