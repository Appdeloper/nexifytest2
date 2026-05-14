import React, { useState, useRef, useEffect } from 'react';
import Header from '../components/Header';
import { Send, Sparkles, Zap, Brain, MessageSquare } from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTIONS = [
  "Summarize my unread chats",
  "Suggest a 20-min workout",
  "How to stay focused today?",
  "Draft an email to my team"
];

import { askNexifyAI } from '../services/gemini';
import { useAuth } from '../hooks/useAuth';

const NexifyAI = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: `Greetings, ${currentUser?.displayName || 'Seeker'}. I am Nexify AI, your neural cognitive assistant. How shall we optimize your reality today?` }
  ]);
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (overrideText) => {
    const messageText = overrideText || text;
    if (!messageText.trim() || isTyping) return;

    const userMsg = { id: Date.now(), sender: 'user', text: messageText };
    setMessages(prev => [...prev, userMsg]);
    setText('');
    setIsTyping(true);

    try {
      const aiResponse = await askNexifyAI(messageText, messages.slice(1));
      setMessages(prev => [
        ...prev, 
        { id: Date.now() + 1, sender: 'ai', text: aiResponse }
      ]);
    } catch (err) {
      showToast(err.message);
      setMessages(prev => [
        ...prev, 
        { id: Date.now() + 1, sender: 'ai', text: "I encountered a neural synchronization error. Please re-initiate uplink." }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fade-in col" style={{ height: '100%', background: 'var(--bg-main)', position: 'relative', overflow: 'hidden' }}>
      {/* ── Holographic Background Elements ── */}
      <div className="bg-floating-glow" style={{ '--glow-color': 'var(--primary)', opacity: 0.15 }} />
      <div className="bg-floating-glow" style={{ '--glow-color': 'var(--primary-pink)', top: '60%', left: '70%', opacity: 0.1 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")', opacity: 0.05, pointerEvents: 'none' }} />

      <div style={{ padding: '20px', borderBottom: '1px solid var(--border-glass)', background: 'var(--bg-glass-heavy)', backdropFilter: 'blur(30px)', display: 'flex', alignItems: 'center', gap: 14, zIndex: 100 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,223,216,0.1)', border: '1px solid var(--border-neon)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Brain size={24} color="var(--primary)" className="animate-pulse" />
        </div>
        <div className="col">
          <h1 className="header-title" style={{ fontSize: 18 }}>Neural Uplink</h1>
          <div className="row align-center gap-2">
            <div className="status-online" style={{ width: 6, height: 6 }} />
            <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--primary)', letterSpacing: 1 }}>SYNCHRONIZED</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 col p-5 gap-6" style={{ overflowY: 'auto', zIndex: 1, scrollbarWidth: 'none' }}>
        {messages.map((msg, i) => (
          <motion.div 
            key={msg.id} 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300, delay: i === messages.length - 1 ? 0 : 0 }}
            style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', width: '100%' }}
          >
            <div className={msg.sender === 'user' ? 'premium-card' : ''} style={{
              maxWidth: '85%',
              padding: '16px 20px',
              borderRadius: '24px',
              borderBottomRightRadius: msg.sender === 'user' ? '4px' : '24px',
              borderBottomLeftRadius: msg.sender === 'ai' ? '4px' : '24px',
              background: msg.sender === 'user' ? 'var(--gradient-primary)' : 'var(--bg-glass-heavy)',
              border: msg.sender === 'ai' ? '1px solid var(--border-glass)' : 'none',
              color: msg.sender === 'user' ? 'black' : 'white',
              boxShadow: msg.sender === 'user' ? '0 10px 30px rgba(0,223,216,0.3)' : '0 10px 30px rgba(0,0,0,0.4)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {msg.sender === 'ai' && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, var(--primary), transparent)', opacity: 0.5 }} />
              )}
              {msg.sender === 'ai' && (
                <div className="row align-center gap-2 mb-3">
                  <Sparkles size={14} color="var(--primary)" />
                  <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--primary)', letterSpacing: 1, textTransform: 'uppercase' }}>Cognitive Response</span>
                </div>
              )}
              <p style={{ fontSize: 14, lineHeight: '1.6', fontWeight: 500 }}>{msg.text}</p>
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '12px 20px', borderRadius: '24px', borderBottomLeftRadius: '4px', background: 'var(--bg-glass)', border: '1px solid var(--border-neon)' }}>
              <div className="typing-dots"><span></span><span></span><span></span></div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Interactive Composer ── */}
      <div style={{ padding: '20px', background: 'linear-gradient(to top, var(--bg-main), transparent)', zIndex: 10 }}>
        {messages.length === 1 && !isTyping && (
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 16, scrollbarWidth: 'none' }}>
            {SUGGESTIONS.map((sug, i) => (
              <motion.button 
                key={i} 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSend(sug)}
                style={{ padding: '10px 20px', borderRadius: 24, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', color: 'var(--text-dim)', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}
              >
                {sug}
              </motion.button>
            ))}
          </div>
        )}

        <div style={{ background: 'var(--bg-glass-heavy)', backdropFilter: 'blur(30px)', border: '1px solid var(--border-glass)', borderRadius: '32px', padding: '8px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
          <input 
            type="text" 
            placeholder="Interrogate the machine..." 
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            style={{ flex: 1, background: 'transparent', border: 'none', padding: '12px 20px', color: 'white', outline: 'none', fontSize: 15, fontWeight: 600 }} 
          />
          
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSend()} 
            disabled={!text.trim() || isTyping} 
            style={{ background: text.trim() ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.05)', color: text.trim() ? 'black' : 'var(--text-dim)', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', transition: 'all 0.3s' }}
          >
            <Send size={20} strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>

      <style>{`
        .typing-dot {
          width: 6px;
          height: 6px;
          background-color: var(--primary);
          border-radius: 50%;
          animation: typingBounce 1.4s infinite ease-in-out both;
        }
        @keyframes typingBounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        @keyframes pulse {
          0% { opacity: 0.5; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.8; transform: translateX(-50%) scale(1.1); }
          100% { opacity: 0.5; transform: translateX(-50%) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default NexifyAI;
