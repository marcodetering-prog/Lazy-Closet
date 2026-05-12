import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AppUser } from '../types';
import { LogIn, Mail, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function AuthWrapper({ children }: { children: (user: AppUser) => React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestMode, setGuestMode] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // When a magic link expires or fails, GoTrue redirects back with
    // #error=...&error_description=... in the hash. Surface it.
    if (window.location.hash.includes('error')) {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const desc = params.get('error_description');
      if (desc) {
        setAuthError(decodeURIComponent(desc.replace(/\+/g, ' ')));
        setLinkSent(false);
      }
      window.history.replaceState(null, '', window.location.pathname);
    }

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

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || sending) return;
    setSending(true);
    setAuthError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setSending(false);
    if (error) {
      setAuthError(error.message);
      return;
    }
    setLinkSent(true);
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
            {linkSent ? (
              <div className="bg-white border border-rose-100 rounded-[2rem] px-6 py-6 text-center shadow-xl shadow-rose-200/20">
                <Mail className="w-8 h-8 text-rose-400 mx-auto mb-3" />
                <p className="text-zinc-700 font-medium mb-1">Check your inbox</p>
                <p className="text-zinc-500 text-sm">We sent a magic link to <span className="font-medium text-zinc-700">{email}</span>.</p>
              </div>
            ) : (
              <form onSubmit={sendMagicLink} className="flex flex-col gap-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full bg-white border border-rose-100 rounded-[2rem] px-6 py-4 text-zinc-900 focus:outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-50 transition-all placeholder:text-zinc-300 shadow-sm text-center"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="group relative flex items-center justify-center gap-3 w-full bg-zinc-900 text-cream-50 px-8 py-5 rounded-[2rem] font-medium transition-all hover:bg-zinc-800 active:scale-95 shadow-2xl shadow-zinc-900/20 disabled:opacity-60"
                >
                  <span className="text-lg">{sending ? 'Sending…' : 'Enter Studio'}</span>
                  <LogIn className="w-5 h-5 transition-transform group-hover:translate-x-1 text-rose-300" />
                </button>
                {authError && (
                  <p className="text-rose-500 text-sm text-center">{authError}</p>
                )}
              </form>
            )}

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
