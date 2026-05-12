import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Item } from '../types';
import { chat } from '../lib/llm';

interface VoiceAssistantProps {
  items: Item[];
  onNavigate: (tab: any) => void;
  onSearch?: (query: string) => void;
}

export default function VoiceAssistant({ items, onNavigate }: VoiceAssistantProps) {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setIsListening(false);
        handleUserMessage(text);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone access denied.');
          setIsActive(false);
        } else if (event.error !== 'no-speech') {
          setError('Error: ' + event.error);
        }
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      window.speechSynthesis.cancel();
    };
  }, [items, messages]);

  const toggleConversation = () => {
    if (isActive) {
      setIsActive(false);
      setIsListening(false);
      if (recognitionRef.current) recognitionRef.current.abort();
      window.speechSynthesis.cancel();
    } else {
      setIsActive(true);
      setMessages([]); // reset chat on new session
      speakAndListen("I am here. How can I help with your styling today?");
    }
  };

  const speakAndListen = (text: string) => {
    setIsSpeaking(true);
    setTranscript(null);
    window.speechSynthesis.cancel();

    utteranceRef.current = new SpeechSynthesisUtterance(text);
    // Optional: pick a good voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    if (englishVoices.length > 0) {
      utteranceRef.current.voice = englishVoices.find(v => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google UK English Female')) || englishVoices[0];
    }

    utteranceRef.current.onend = () => {
      setIsSpeaking(false);
      if (isActive && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error(e);
        }
      }
    };
    
    window.speechSynthesis.speak(utteranceRef.current);
  };

  const handleUserMessage = async (text: string) => {
    if (!text.trim()) {
      if (isActive) {
         try { recognitionRef.current.start(); } catch(e){}
      }
      return;
    }

    // Try explicit navigation commands just in case
    const lower = text.toLowerCase();
    if (lower.includes('go to closet') || lower.includes('open wardrobe')) {
       onNavigate('wardrobe');
       speakAndListen('Opening your closet.');
       return;
    } else if (lower.includes('go to mirror') || lower.includes('try on')) {
       onNavigate('mirror');
       speakAndListen('Opening the virtual mirror.');
       return;
    }

    const newMessages = [...messages, { role: 'user' as const, text }];
    setMessages(newMessages);
    setIsSpeaking(true); // act as "thinking" 

    try {
      const itemsSummary = items.map(i => `- ${i.name} (${i.category}${i.color ? `, ${i.color}` : ''})`).join('\n');
      const systemInstruction = `You are Aether, a sophisticated, succinct AI fashion stylist. The user is talking to you via a voice interface. 
Keep your answers extremely brief, conversational, and fashion-forward. 1-2 short sentences max.
Current wardrobe context:
${itemsSummary || 'Wardrobe is empty.'}`;

      const chatMessages = newMessages.map(m => ({
        role: m.role === 'model' ? ('assistant' as const) : ('user' as const),
        content: m.text,
      }));

      const reply = (await chat(chatMessages, { systemInstruction, maxTokens: 200 }))
        || "I was unable to process that.";
      setMessages([...newMessages, { role: 'model', text: reply }]);
      speakAndListen(reply);

    } catch (e) {
      console.error(e);
      speakAndListen("I seem to have lost connection to the atelier.");
    }
  };

  // Auto-clear error after 4s
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(t);
  }, [error]);

  return (
    <div className="fixed bottom-24 right-8 z-50 md:bottom-8 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-64 bg-white/90 backdrop-blur-xl border border-rose-100 rounded-[2rem] p-6 shadow-2xl flex flex-col items-center text-center origin-bottom-right"
          >
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mb-4 relative shadow-inner">
               {isSpeaking && (
                 <motion.div 
                   animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                   transition={{ repeat: Infinity, duration: 2 }}
                   className="absolute inset-0 bg-rose-300 rounded-full"
                 />
               )}
               {isListening && (
                 <motion.div 
                   animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0.2, 0.8] }}
                   transition={{ repeat: Infinity, duration: 1.5 }}
                   className="absolute inset-0 bg-rose-200 rounded-full border-2 border-rose-400"
                 />
               )}
               <Sparkles className={cn("w-8 h-8", isListening ? "text-rose-500" : isSpeaking ? "text-rose-400 animate-pulse" : "text-rose-300")} />
            </div>
            
            <h3 className="text-lg font-serif text-zinc-900 mb-2">
              {isListening ? "Listening..." : isSpeaking ? "Aether speaks..." : "Aether is ready"}
            </h3>
            
            <p className="text-xs text-zinc-500 font-light italic min-h-[40px] flex items-center justify-center">
               {transcript ? `"${transcript}"` : isListening ? "Go ahead, I'm listening." : isSpeaking ? "..." : "Waiting for you to speak..."}
            </p>
            
            {error && <p className="text-[10px] text-red-500 mt-2">{error}</p>}
            
            <button 
              onClick={toggleConversation}
              className="mt-6 w-10 h-10 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleConversation}
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 relative",
          isActive 
            ? "bg-rose-500 text-white ring-4 ring-rose-200" 
            : "bg-zinc-900 text-cream-50 hover:bg-zinc-800"
        )}
      >
        {isActive ? (
          <Mic className="w-6 h-6 animate-pulse" />
        ) : (
          <Sparkles className="w-6 h-6" />
        )}
        
        {!isActive && (
           <div className="absolute -top-1 -right-1 bg-rose-400 text-[8px] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Aether
           </div>
        )}
      </motion.button>
    </div>
  );
}
