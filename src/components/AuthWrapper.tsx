import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AppUser } from '../types';
import { LogIn, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function AuthWrapper({ children }: { children: (user: AppUser) => React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestMode, setGuestMode] = useState(false);

  useEffect(() => {
    // Check active sessions and sets the user
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({
          uid: session.user.id,
          email: session.user.email || null,
          displayName: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
          photoURL: session.user.user_metadata.avatar_url || null,
        });
      }
      setLoading(false);
    };

    checkUser();

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          uid: session.user.id,
          email: session.user.email || null,
          displayName: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
          photoURL: session.user.user_metadata.avatar_url || null,
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) console.error('Error logging in with Supabase:', error.message);
  };

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

  if (guestMode) {
    return <>{children({ uid: 'guest-user', displayName: 'Guest', email: 'guest@example.com', photoURL: null })}</>;
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
          
          <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
            <button
              onClick={signInWithGoogle}
              className="group relative flex items-center justify-center gap-3 w-full bg-zinc-900 text-cream-50 px-8 py-5 rounded-[2rem] font-medium transition-all hover:bg-zinc-800 active:scale-95 shadow-2xl shadow-zinc-900/20"
            >
              <span className="text-lg">Enter Studio</span>
              <LogIn className="w-5 h-5 transition-transform group-hover:translate-x-1 text-rose-300" />
            </button>

            <button
               onClick={() => setGuestMode(true)}
               className="text-zinc-400 hover:text-rose-500 text-sm font-medium transition-colors"
            >
              Try Preview Mode
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children(user)}</>;
}
