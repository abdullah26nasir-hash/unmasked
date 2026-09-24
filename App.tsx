
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  Crosshair, 
  Trophy, 
  Skull, 
  Eye, 
  RotateCcw, 
  Home,
  MessageCircle,
  X,
  Send,
  Loader2,
  BrainCircuit,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GoogleGenAI } from "@google/genai";

// --- CONFIGURATION ---

// NOTE: Ensure these files exist in your public/assets/ folder
// Format: /assets/lowercase_name.png
const CHARACTER_IMAGES: Record<string, string> = {
  "MrBeast": "/assets/mrbeast.png",
  "MKBHD": "/assets/mkbhd.png",
  "KSI": "/assets/ksi.png",
  "Logan Paul": "/assets/loganpaul.png",
  "IShowSpeed": "/assets/ishowspeed.png",
  "Kai Cenat": "/assets/kaicenat.png", 
  "PewDiePie": "/assets/pewdiepie.png",
  "Niko Omilana": "/assets/nikoomilana.png",
  "Chunkz": "/assets/chunkz.png",
  "Sharky": "/assets/sharky.png",
  "King Kenny": "/assets/kingkenny.png",
  "AJ Shabeel": "/assets/ajshabeel.png", 
  "Dream": "/assets/dream.png",
  "TommyInnit": "/assets/tommyinnit.png",
  "Pokimane": "/assets/pokimane.png",
  "Valkyrae": "/assets/valkyrae.png",
  "Mark Rober": "/assets/markrober.png",
  "MoistCr1TiKaL": "/assets/moistcr1tikal.png", 
  "Dude Perfect": "/assets/dudeperfect.png",
  "Casey Neistat": "/assets/caseyneistat.png",
  "ChrisMD": "/assets/chrismd.png", 
  "W2S": "/assets/w2s.png", 
  "Miniminter": "/assets/miniminter.png", 
  "Vikkstar123": "/assets/vikkstar123.png"
};

const NAMES = Object.keys(CHARACTER_IMAGES);

// --- TYPES ---

type GameState = 'LOBBY' | 'PLAYING' | 'WIN' | 'LOSE';

interface Character {
  id: string;
  name: string;
  isEliminated: boolean;
  image: string;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// --- COMPONENTS ---

// 1. The 3D Acrylic Card
interface CardProps {
  char: Character;
  isSnipeMode: boolean;
  onClick: (id: string) => void;
  disabled: boolean;
}

const Card: React.FC<CardProps> = ({ char, isSnipeMode, onClick, disabled }) => {
  // Note: We use a ref to track if we've already tried the fallback to prevent loops
  const [imgSrc, setImgSrc] = useState(char.image);

  const variants: Variants = {
    standing: { rotateX: 0, y: 0, filter: "brightness(1) contrast(1)" },
    eliminated: { 
      rotateX: -85, 
      y: 12,
      filter: "brightness(0.7) contrast(0.9) sepia(0.2)",
      transition: { type: "spring", stiffness: 180, damping: 20 }
    }
  };

  const cursor = disabled ? 'cursor-not-allowed' : isSnipeMode ? 'cursor-crosshair' : 'cursor-pointer';

  const handleImageError = () => {
    // If the local file fails (404), fallback to a generated avatar so the game looks good
    if (!imgSrc.includes("dicebear")) {
      setImgSrc(`https://api.dicebear.com/9.x/avataaars/svg?seed=${char.name}`);
    }
  };

  return (
    <div className={`relative w-full aspect-[3/4.2] perspective-1000 group ${cursor}`}>
      <motion.div
        className="w-full h-full preserve-3d origin-bottom"
        initial="standing"
        animate={char.isEliminated ? "eliminated" : "standing"}
        variants={variants}
        whileHover={!disabled && !char.isEliminated ? { scale: 1.05, y: -10 } : {}}
        onClick={() => !disabled && onClick(char.id)}
      >
        {/* Card Body */}
        <div className={`
          absolute inset-0 rounded-3xl border-[5px] flex flex-col items-center justify-end overflow-hidden transition-all duration-300
          ${isSnipeMode && !char.isEliminated ? 'border-[#F47575] shadow-[0_0_25px_rgba(244,117,117,0.5)]' : 'border-white'}
          ${char.isEliminated ? 'bg-slate-200' : 'bg-white shadow-[0_8px_0px_rgba(0,0,0,0.1)]'}
        `}>
          {/* Background Element for Depth */}
          {!char.isEliminated && (
             <div className="absolute inset-x-4 bottom-4 top-8 bg-gradient-to-b from-slate-50 to-slate-100 rounded-t-full -z-10" />
          )}

          {/* Character Image (Standee) */}
          <div className="absolute inset-0 bottom-8 flex items-end justify-center px-1 pb-1">
            <img 
              src={imgSrc} 
              alt={char.name}
              onError={handleImageError}
              className="w-full h-[92%] object-contain drop-shadow-xl select-none pointer-events-none filter hover:brightness-110 transition-all"
            />
          </div>

          {/* Name Label */}
          <div className={`
            relative z-10 mb-3 px-3 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider w-[90%] text-center transition-colors truncate border-2
            ${char.isEliminated 
              ? 'bg-slate-300 text-slate-500 border-slate-300' 
              : 'bg-[#FFDA57] text-[#100F06] border-[#E5C24E] shadow-sm'}
          `}>
            {char.name}
          </div>
        </div>

        {/* Card Back */}
        <div 
          className="absolute inset-0 rounded-3xl bg-[#F47575] border-[5px] border-[#d66060] backface-hidden flex items-center justify-center"
          style={{ transform: "rotateX(180deg)" }}
        >
          <div className="text-white/50 font-black text-5xl rotate-180">✕</div>
        </div>
      </motion.div>

      {/* Shadow Base */}
      {!char.isEliminated && (
        <motion.div 
          className="absolute -bottom-4 left-4 right-4 h-4 bg-black/20 blur-lg rounded-[50%] -z-10"
          initial={false}
          animate={{ scale: 1, opacity: 0.4 }}
        />
      )}
    </div>
  );
};

// 2. The AI Opponent Widget
interface OpponentProps {
  suspectsCount: number;
  message: string;
  isThinking: boolean;
  onChatClick: () => void;
}

const OpponentWidget: React.FC<OpponentProps> = ({ suspectsCount, message, isThinking, onChatClick }) => {
  return (
    <motion.div 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-20 sm:top-4 right-4 z-40 flex flex-col items-end gap-2 pointer-events-none"
    >
      {/* Speech Bubble */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={message + isThinking}
          initial={{ opacity: 0, scale: 0.8, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="bg-white px-4 py-3 rounded-2xl rounded-tr-none shadow-xl border-2 border-[#100F06] max-w-[220px]"
        >
          {isThinking ? (
            <div className="flex gap-1 h-4 items-center justify-center w-full">
              <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-2 h-2 bg-[#7DCAF6] rounded-full" />
              <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 bg-[#7DCAF6] rounded-full" />
              <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 bg-[#7DCAF6] rounded-full" />
            </div>
          ) : (
            <p className="text-xs font-bold text-[#100F06] leading-snug">{message}</p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* The Device */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">The Collector</span>
          <div className="flex items-center gap-2">
             <button 
               onClick={onChatClick}
               className="p-2 bg-white rounded-lg border-2 border-slate-200 text-[#00917A] hover:bg-slate-50 active:scale-95 transition-all shadow-sm flex items-center gap-1 group"
               title="Chat with AI"
             >
               <MessageCircle size={16} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
               <span className="text-[10px] font-bold text-[#00917A] hidden sm:inline">CHAT</span>
             </button>
             <span className={`text-xs font-bold text-[#00917A] bg-white px-3 py-2 rounded-lg shadow-sm border-2 border-slate-200 transition-colors duration-500 ${isThinking ? 'bg-yellow-50 border-yellow-200' : ''}`}>
              {isThinking ? <Loader2 size={14} className="animate-spin" /> : `${suspectsCount} Left`}
            </span>
          </div>
        </div>

        <div className={`
          w-16 h-16 bg-[#7DCAF6] rounded-[24px] border-4 border-white shadow-[0_8px_0px_rgba(0,0,0,0.1)] 
          flex items-center justify-center relative overflow-hidden transition-all duration-300
          ${isThinking ? 'scale-110 shadow-[0_12px_0px_rgba(0,0,0,0.1)]' : 'scale-100'}
        `}>
           <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent" />
           <img 
             src={`https://api.dicebear.com/9.x/bottts/svg?seed=Collector`} 
             className={`w-10 h-10 drop-shadow-sm relative z-10 transition-transform duration-500 ${isThinking ? 'scale-110 rotate-6' : ''}`}
             alt="AI Avatar"
           />
           {/* Status Light */}
           <div className={`absolute top-2 right-2 w-2 h-2 rounded-full transition-colors duration-300 ${isThinking ? 'bg-yellow-400 animate-pulse shadow-[0_0_8px_#FACC15]' : 'bg-green-400'}`} />
        </div>
      </div>
    </motion.div>
  );
};

// 3. Chat Modal (With Search)
const ChatModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "I track everything. Ask me about any of these creators." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Use Gemini with Search Tool
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `
          You are "The Collector", a competitive AI in a deduction game.
          The user is asking: "${userMsg}".
          If the question is about current events or facts regarding YouTubers (MrBeast, KSI, etc.), use Google Search to find the answer.
          Keep your response concise, accurate, but maintain a slightly arrogant/snarky game persona.
        `,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
      
      const text = response.text || "I couldn't find that info. Maybe they fell off?";
      setMessages(prev => [...prev, { role: 'model', text }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'model', text: "Connection glitch. Ask me later." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-md h-[60vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden border-4 border-[#7DCAF6]"
          >
            {/* Header */}
            <div className="bg-[#7DCAF6] p-4 flex justify-between items-center">
              <h3 className="text-white font-black text-lg flex items-center gap-2">
                <BrainCircuit size={24} /> COLLECTOR LINK
              </h3>
              <button onClick={onClose} className="bg-white/20 p-2 rounded-full text-white hover:bg-white/30 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F5F4ED]">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm font-bold leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-[#00917A] text-white rounded-tr-none' 
                      : 'bg-white text-[#100F06] shadow-[0_2px_0px_rgba(0,0,0,0.05)] border border-slate-100 rounded-tl-none'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-2 items-center">
                    <Loader2 className="animate-spin text-[#7DCAF6]" size={16} />
                    <span className="text-xs text-slate-400 font-bold">Searching network...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Search or chat..."
                className="flex-1 bg-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-[#100F06] outline-none focus:ring-2 ring-[#7DCAF6] transition-all"
              />
              <button 
                onClick={handleSend}
                disabled={loading}
                className="bg-[#00917A] text-white p-3 rounded-xl hover:bg-[#007a65] active:scale-95 transition-all disabled:opacity-50 shadow-[0_4px_0px_#006B5A] active:translate-y-1 active:shadow-none"
              >
                <Send size={20} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- MAIN APP ---

export default function App() {
  // Game State
  const [gameState, setGameState] = useState<GameState>('LOBBY');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [myCharacter, setMyCharacter] = useState<Character | null>(null);
  const [targetCharacter, setTargetCharacter] = useState<Character | null>(null);
  
  // AI State
  const [aiSuspects, setAiSuspects] = useState(23);
  const [aiMessage, setAiMessage] = useState("I'm watching you.");
  const [aiThinking, setAiThinking] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  
  // UI State
  const [isSnipeMode, setIsSnipeMode] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [missFeedback, setMissFeedback] = useState(false);

  // Initialize
  useEffect(() => {
    const chars = NAMES.map((name, idx) => ({
      id: `char-${idx}`,
      name,
      isEliminated: false,
      image: CHARACTER_IMAGES[name]
    }));
    setCharacters(chars);
  }, []);

  // --- AI LOGIC ---

  const generateAiResponse = async (action: 'ELIMINATE' | 'START' | 'WIN' | 'LOSE' | 'MISS') => {
    // Note: Thinking state is handled by the wrapper function (handleAiTurn)
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        You are "The Collector", a snarky, competitive AI playing a deduction game (like Guess Who) against a human.
        Context:
        - Action: ${action}
        - Suspects Left (You): ${aiSuspects}
        - Game Turn: ${turnCount}
        
        Task: Write a very short (max 12 words), witty, slightly roasting comment to the player. 
        Personality: Arrogant, playful, uses internet slang occasionally.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      
      if (response.text) {
        setAiMessage(response.text.trim());
      }
    } catch (error) {
      console.error("Gemini Error", error);
      const fallbacks = ["My processor is faster than your brain.", "Is that your best move?", "Calculating your defeat..."];
      setAiMessage(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
    }
  };

  // AI Turn Logic Wrapper
  useEffect(() => {
    if (gameState !== 'PLAYING' || turnCount === 0) return;

    const handleAiTurn = async () => {
      // 1. Start Thinking Animation
      setAiThinking(true);
      setAiMessage("..."); 

      // 2. Wait to simulate processing time
      await new Promise(r => setTimeout(r, 2000));

      // 3. Update Game State (Deduction)
      setAiSuspects(prev => {
        const drop = Math.floor(Math.random() * 2) + 1;
        return Math.max(1, prev - drop);
      });

      // 4. Generate Message & Stop Thinking
      await generateAiResponse('ELIMINATE');
      setAiThinking(false);
    };

    handleAiTurn();
  }, [turnCount, gameState]);

  // --- HANDLERS ---

  const startGame = (characterId: string) => {
    const selected = characters.find(c => c.id === characterId);
    if (!selected) return;

    // AI picks a random target different from player
    const others = characters.filter(c => c.id !== characterId);
    const target = others[Math.floor(Math.random() * others.length)];

    setMyCharacter(selected);
    setTargetCharacter(target);
    setGameState('PLAYING');
    setAiSuspects(23);
    setTurnCount(0);
    setAiThinking(false);
    generateAiResponse('START');
  };

  const handleCardClick = (id: string) => {
    if (gameState !== 'PLAYING' || aiThinking) return; // Block input during AI turn

    if (isSnipeMode) {
      if (targetCharacter && characters.find(c => c.id === id)?.name === targetCharacter.name) {
        handleWin();
      } else {
        // SNIPE MISS LOGIC
        setMissFeedback(true);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        setTimeout(() => setMissFeedback(false), 1500);
        
        // Eliminate the wrong card
        setCharacters(prev => prev.map(c => 
            c.id === id ? { ...c, isEliminated: !c.isEliminated } : c
        ));

        // Advance turn (AI still gets to play)
        setTurnCount(prev => prev + 1);
        generateAiResponse('MISS');
      }
    } else {
      setCharacters(prev => prev.map(c => 
        c.id === id ? { ...c, isEliminated: !c.isEliminated } : c
      ));
      
      // Only trigger AI turn if we actually eliminated someone (flipped down)
      const char = characters.find(c => c.id === id);
      if (char && !char.isEliminated) {
        setTurnCount(prev => prev + 1);
      }
    }
  };

  const handleWin = () => {
    setGameState('WIN');
    generateAiResponse('WIN');
    confetti({
      particleCount: 200,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFDA57', '#00917A', '#F47575']
    });
  };

  const handleLose = () => {
    setGameState('LOSE');
    generateAiResponse('LOSE');
  };

  const playAgain = () => {
    // Randomly pick for player to speed up loop (Instant Restart)
    const randomMyChar = characters[Math.floor(Math.random() * characters.length)];
    
    // Reset board
    setCharacters(prev => prev.map(c => ({ ...c, isEliminated: false })));
    setIsSnipeMode(false);
    setAiThinking(false);
    
    // Start immediate
    startGame(randomMyChar.id);
  };

  const goToLobby = () => {
    setCharacters(prev => prev.map(c => ({ ...c, isEliminated: false })));
    setMyCharacter(null);
    setTargetCharacter(null);
    setGameState('LOBBY');
    setIsSnipeMode(false);
    setAiThinking(false);
  };

  // --- RENDER ---

  return (
    <div className="relative min-h-screen w-full bg-[#F5F4ED] flex flex-col overflow-hidden font-sans selection:bg-[#FFDA57]">
      
      <div className="absolute inset-0 pointer-events-none opacity-40" 
           style={{ backgroundImage: 'radial-gradient(#d4d4d4 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

      {/* MISS OVERLAY */}
      <AnimatePresence>
        {missFeedback && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1.5 }}
            exit={{ opacity: 0, scale: 2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          >
            <h1 className="text-8xl sm:text-9xl font-black text-[#F47575] drop-shadow-[0_10px_0px_rgba(0,0,0,0.2)] stroke-black tracking-tighter rotate-12 border-text">
              MISS!
            </h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <ChatModal isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      {/* HUD */}
      <header className="relative z-30 w-full px-6 py-4 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm p-2 rounded-2xl border border-white shadow-sm pointer-events-auto">
          <div className="bg-[#100F06] text-white p-2 rounded-xl">
            <Skull size={20} />
          </div>
          <h1 className="text-xl font-black tracking-tighter text-[#100F06] hidden sm:block">UNMASKED</h1>
        </div>
        
        {gameState === 'PLAYING' && myCharacter && (
          <motion.div 
            initial={{ y: -50 }} animate={{ y: 0 }}
            className="bg-white border-2 border-slate-200 pl-4 pr-2 py-1 rounded-full flex items-center gap-3 shadow-sm pointer-events-auto"
          >
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Your Secret</span>
            <div className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-full">
               <img 
                 src={myCharacter.image} 
                 className="w-6 h-6 object-contain" 
                 alt="me" 
                 onError={(e) => e.currentTarget.src = `https://api.dicebear.com/9.x/avataaars/svg?seed=${myCharacter?.name}`}
               />
               <span className="text-xs font-bold text-[#100F06]">{myCharacter.name}</span>
            </div>
          </motion.div>
        )}
      </header>

      {/* GAME STAGE */}
      <main className="flex-1 relative flex items-center justify-center p-4 sm:p-8 perspective-1000">
        
        {gameState !== 'LOBBY' && (
           <OpponentWidget 
             suspectsCount={aiSuspects} 
             message={aiMessage} 
             isThinking={aiThinking}
             onChatClick={() => setChatOpen(true)} 
           />
        )}

        <AnimatePresence mode="wait">
          
          {/* LOBBY */}
          {gameState === 'LOBBY' && (
            <motion.div 
              key="lobby"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
              className="w-full max-w-5xl bg-white rounded-[48px] shadow-2xl p-6 sm:p-10 border-4 border-white/50 backdrop-blur-xl relative z-20"
            >
              <div className="text-center mb-8">
                <span className="bg-[#FFDA57] text-[#100F06] px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4 inline-block">Phase 1</span>
                <h2 className="text-3xl sm:text-5xl font-black text-[#00917A] mb-2 tracking-tight">WHO ARE YOU HIDING?</h2>
                <p className="text-slate-400 font-bold text-lg">Select your secret identity to begin the match.</p>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4 max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar">
                {characters.map((char) => (
                  <button
                    key={char.id}
                    onClick={() => startGame(char.id)}
                    className="group relative aspect-[3/4] bg-[#F5F4ED] rounded-2xl border-[3px] border-transparent hover:border-[#FFDA57] hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden"
                  >
                    <div className="absolute inset-0 flex items-end justify-center px-2 pb-8">
                       <img 
                         src={char.image} 
                         className="w-full h-[90%] object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300" 
                         alt={char.name}
                         onError={(e) => e.currentTarget.src = `https://api.dicebear.com/9.x/avataaars/svg?seed=${char.name}`}
                       />
                    </div>
                    <div className="absolute bottom-0 inset-x-0 bg-white/90 backdrop-blur-sm py-2 text-center border-t border-slate-100 z-10">
                      <span className="text-[10px] font-black text-[#100F06] uppercase truncate px-1 block">{char.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* PLAYING BOARD */}
          {gameState === 'PLAYING' && (
            <motion.div
              key="board"
              initial={{ opacity: 0, y: 100, rotateX: 20 }}
              animate={isShaking ? { 
                opacity: 1, 
                y: 0, 
                rotateX: 5,
                x: [-10, 10, -10, 10, 0] 
              } : { 
                opacity: 1, 
                y: 0, 
                rotateX: 5 
              }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.8 }}
              className="w-full max-w-6xl relative pb-24 sm:pb-0"
            >
              {/* 3D Tray Visual */}
              <div className="bg-[#FFDA57] p-4 sm:p-8 rounded-[40px] sm:rounded-[60px] shadow-[0_20px_0px_#E5C24E,0_40px_60px_rgba(0,0,0,0.15)] border-[6px] border-[#ffe68c] relative z-10 mx-auto">
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-6">
                  {characters.map((char) => (
                    <Card 
                      key={char.id}
                      char={char}
                      isSnipeMode={isSnipeMode}
                      onClick={handleCardClick}
                      disabled={aiThinking} // Disable input while AI thinks
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* RESULTS MODAL */}
          {(gameState === 'WIN' || gameState === 'LOSE') && (
             <motion.div 
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
             >
               <motion.div 
                 initial={{ scale: 0.5, rotate: -5 }}
                 animate={{ scale: 1, rotate: 0 }}
                 className={`bg-white w-full max-w-md rounded-[48px] p-8 text-center shadow-2xl border-[8px] ${gameState === 'WIN' ? 'border-[#FFDA57]' : 'border-[#F47575]'}`}
               >
                  <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center text-6xl shadow-inner border-4 border-white overflow-hidden p-2">
                    {gameState === 'WIN' ? 
                      <img 
                        src={targetCharacter?.image} 
                        className="w-full h-full object-contain" 
                        alt="Target"
                        onError={(e) => e.currentTarget.src = `https://api.dicebear.com/9.x/avataaars/svg?seed=${targetCharacter?.name}`}
                      /> : 
                      '💀'
                    }
                  </div>
                  
                  <h2 className="text-4xl font-black text-[#100F06] mb-2 tracking-tight">
                    {gameState === 'WIN' ? 'YOU WON!' : 'GAME OVER'}
                  </h2>
                  
                  <p className="text-slate-500 font-bold mb-8 text-lg leading-tight">
                    {gameState === 'WIN' 
                      ? <span>You exposed <span className="text-[#00917A]">{targetCharacter?.name}</span>!</span> 
                      : <span>It was <span className="text-[#F47575]">{targetCharacter?.name}</span>. You got played.</span>}
                  </p>

                  <div className="space-y-3">
                    <button 
                      onClick={playAgain}
                      className="w-full bg-[#00917A] text-white font-black py-4 rounded-2xl text-lg shadow-[0_6px_0px_#006B5A] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 hover:bg-[#007a65]"
                    >
                      <RotateCcw size={24} strokeWidth={3} /> PLAY AGAIN
                    </button>
                    <button 
                      onClick={goToLobby}
                      className="w-full bg-slate-200 text-slate-600 font-black py-4 rounded-2xl text-lg hover:bg-slate-300 transition-all flex items-center justify-center gap-2 shadow-[0_6px_0px_#cbd5e1] active:translate-y-1 active:shadow-none"
                    >
                      <Home size={24} strokeWidth={3} /> MAIN MENU
                    </button>
                  </div>
               </motion.div>
             </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* FOOTER CONTROLS */}
      {gameState === 'PLAYING' && (
        <footer className="fixed bottom-6 left-0 right-0 flex justify-center items-end z-40 pointer-events-none">
          <motion.div 
            initial={{ y: 100 }} animate={{ y: 0 }}
            className="bg-white/90 backdrop-blur-xl p-2 pr-3 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.2)] border-2 border-white pointer-events-auto flex gap-4 items-center"
          >
            <button
              onClick={() => setIsSnipeMode(!isSnipeMode)}
              disabled={aiThinking}
              className={`
                relative h-16 px-8 rounded-full flex items-center justify-center gap-3 transition-all duration-200 border-b-4 active:border-b-0 active:translate-y-1
                ${isSnipeMode 
                  ? 'bg-[#F47575] border-[#c45656] text-white shadow-[0_8px_20px_rgba(244,117,117,0.4)]' 
                  : 'bg-[#00917A] border-[#006B5A] text-white shadow-[0_8px_20px_rgba(0,145,122,0.3)]'}
                ${aiThinking ? 'opacity-50 cursor-not-allowed grayscale' : ''}
              `}
            >
              {isSnipeMode ? <Crosshair size={24} strokeWidth={3} /> : <Eye size={24} strokeWidth={3} />}
              <span className="text-sm font-black uppercase tracking-widest">
                {isSnipeMode ? 'SNIPE TARGET' : 'GUESS MODE'}
              </span>
            </button>
          </motion.div>
        </footer>
      )}
    </div>
  );
}
