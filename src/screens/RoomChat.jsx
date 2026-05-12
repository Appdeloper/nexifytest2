import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { RoleBadge, RankBadge } from '../components/Badges';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ToastProvider';
import { 
  Info, Plus, Smile, Image as ImageIcon, Mic, Send, Paperclip, FileText, 
  Sparkles, Pin, MoreVertical, MessageSquare, Phone, Volume2, X 
} from 'lucide-react';
import { 
  subscribeRoomMessages, sendRoomMessage, sendRoomMediaMessage, 
  uploadRoomAttachment, sendRoomGifMessage, leaveRoom,
  togglePinRoomMessage, reactToRoomMessage, removeReactionFromRoomMessage
} from '../services/rooms';

const REACTION_EMOJIS = ['❤️', '🔥', '😂', '😮', '😢', '💯'];

const MOCK_GIFS = [
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJndXIzYXJtN2Z0Z3ZueXp3Y2Z6Z3B3Z3B3Z3B3Z3B3Z3B3JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKSjPPrTVf9661G/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJndXIzYXJtN2Z0Z3ZueXp3Y2Z6Z3B3Z3B3Z3B3Z3B3JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/l0HlS0mY8v9z3H7G8/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJndXIzYXJtN2Z0Z3ZueXp3Y2Z6Z3B3Z3B3Z3B3Z3B3JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKDkDbIDJieKbVm/giphy.gif'
];

const SMART_REPLIES = ['Hey!', 'How are you?', 'Great work!', 'Love this room', 'LFG! 🚀'];

const PinnedMessagesSheet = ({ pins, onClose }) => (
  <motion.div
    initial={{ y: '100%' }}
    animate={{ y: 0 }}
    exit={{ y: '100%' }}
    style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
  >
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
    <div style={{ position: 'relative', background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.1)', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '20px 16px 40px', maxHeight: '70vh', overflowY: 'auto' }}>
      <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, margin: '0 auto 20px' }} />
      <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 20, textAlign: 'center' }}>Pinned Messages</h3>
      {pins.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No pinned messages yet.</div>
      ) : (
        pins.map(msg => (
          <div key={msg.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 12, marginBottom: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', marginBottom: 4 }}>PINNED</div>
            <p style={{ fontSize: 13 }}>{msg.text || '[Media]'}</p>
          </div>
        ))
      )}
    </div>
  </motion.div>
);

const RoomChat = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [messages, setMessages] = useState([]);
  const [roomData, setRoomData] = useState(null);
  const [memberProfiles, setMemberProfiles] = useState({});
  const [text, setText] = useState('');
  const [loadingMsg, setLoadingMsg] = useState(true);
  const [showGifs, setShowGifs] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [showPins, setShowPins] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null); // { id, x, y }
  const [inVoice, setInVoice] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!currentUser || !roomId) return;

    const loadRoom = async () => {
      const roomDoc = await getDoc(doc(db, 'rooms', roomId));
      if (roomDoc.exists()) {
        const data = roomDoc.data();
        setRoomData(data);
        
        if (data.members && data.members.length > 0) {
          const profiles = {};
          await Promise.all(data.members.map(async (uid) => {
            const pDoc = await getDoc(doc(db, 'users', uid));
            if (pDoc.exists()) profiles[uid] = pDoc.data();
          }));
          setMemberProfiles(profiles);
        }
      }
    };
    loadRoom();

    const unsub = subscribeRoomMessages(roomId, (msgs) => {
      setMessages(msgs);
      setLoadingMsg(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 150);
      
      // AI Tag Detection
      import('../services/ai').then(({ processAITag }) => {
        processAITag(roomId, true, msgs);
      });
    });

    return () => unsub();
  }, [roomId, currentUser]);

  const pinnedMessages = messages.filter(m => m.isPinned);

  const handleTogglePin = async (msg) => {
    try {
      await togglePinRoomMessage(roomId, msg.id, msg.isPinned);
      showToast(msg.isPinned ? 'Message unpinned' : 'Message pinned 📌');
      setActiveMenu(null);
    } catch (e) {
      showToast('Failed to update pin');
    }
  };

  const handleReact = async (msgId, emoji) => {
    try {
      const msg = messages.find(m => m.id === msgId);
      const hasReacted = msg.reactions?.[emoji]?.includes(currentUser.uid);
      if (hasReacted) {
        await removeReactionFromRoomMessage(roomId, msgId, currentUser.uid, emoji);
      } else {
        await reactToRoomMessage(roomId, msgId, currentUser.uid, emoji);
      }
      setActiveMenu(null);
    } catch (e) {
      showToast('Failed to react');
    }
  };

  const handleSend = async () => {
    if (!text.trim() || isSending) return;
    setIsSending(true);
    try {
      await sendRoomMessage(roomId, currentUser.uid, text);
      setText('');
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e) {
      showToast(e.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('File too large (max 10MB)');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    if (file.type.startsWith('image/')) {
      setUploadPreview(URL.createObjectURL(file));
    } else {
      setUploadPreview(null);
    }

    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    uploadRoomAttachment(roomId, file,
      (progress) => setUploadProgress(progress),
      async (url) => {
        setIsUploading(false);
        setUploadPreview(null);
        const type = file.type.startsWith('image/') ? 'image' : 'file';
        await sendRoomMediaMessage(roomId, currentUser.uid, file, type, url);
      },
      (error) => {
        setIsUploading(false);
        setUploadPreview(null);
        showToast('Upload failed: ' + error.message);
      }
    );
  };

  const handleGifSelect = async (gifUrl) => {
    setShowGifs(false);
    try {
      await sendRoomGifMessage(roomId, currentUser.uid, gifUrl);
    } catch (e) {
      showToast('Failed to send GIF');
    }
  };

  const handleLeave = async () => {
    if (window.confirm('Are you sure you want to leave this room?')) {
      try {
        await leaveRoom(roomId, currentUser.uid);
        navigate('/rooms');
      } catch (e) {
        showToast('Failed to leave room');
      }
    }
  };

  return (
    <div className="col" style={{ height: '100dvh', background: '#000', position: 'relative', zIndex: 10 }}>
      {/* Header */}
      <header style={{ 
        padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
            <span style={{ fontSize: '20px' }}>←</span>
          </motion.button>
          <div style={{ position: 'relative' }}>
             <img src={roomData?.iconURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${roomId}`} alt="" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', objectFit: 'cover' }} />
              {inVoice && <div style={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, background: '#10b981', border: '2px solid #000', borderRadius: '50%' }} />}
          </div>
          <div className="col">
            <span style={{ fontWeight: 800, fontSize: 14 }}>{roomData?.name || 'Loading...'}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>{roomData?.members?.length || 0} MEMBERS</span>
              {pinnedMessages.length > 0 && (
                <div onClick={() => setShowPins(true)} style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(0,223,216,0.1)', padding: '2px 6px', borderRadius: 10, cursor: 'pointer' }}>
                  <Pin size={8} color="var(--primary)" />
                  <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--primary)' }}>{pinnedMessages.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => setInVoice(!inVoice)}
            style={{ 
              background: inVoice ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.06)',
              border: inVoice ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255,255,255,0.1)',
              padding: '8px 12px', borderRadius: 12, color: inVoice ? '#10b981' : 'white',
              fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'
            }}
          >
            {inVoice ? <Volume2 size={14} /> : <Phone size={14} />}
            {inVoice ? 'VOICE ON' : 'JOIN VOICE'}
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleLeave} style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer' }}>
            <MoreVertical size={20} color="var(--text-muted)" />
          </motion.button>
        </div>
      </header>

      {/* Messages */}
      <div 
        className="flex-1 col p-4 gap-3" 
        style={{ overflowY: 'auto', paddingBottom: '20px' }}
        onClick={() => setActiveMenu(null)}
      >
        {loadingMsg && <p className="text-center text-muted text-sm mt-4">Loading messages...</p>}
        {!loadingMsg && messages.length === 0 && (
          <div className="flex-1 col flex-center text-center mt-4 fade-in">
            <p className="text-muted text-sm bg-glass p-2" style={{ borderRadius: '16px' }}>Be the first to speak in this room!</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.senderId === currentUser.uid;
          const prevMsg = i > 0 ? messages[i - 1] : null;
          const isGrouped = prevMsg && prevMsg.senderId === msg.senderId;
          const time = msg.createdAt ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

          return (
            <div key={msg.id} className="pop-in" style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', width: '100%', marginTop: isGrouped ? '-8px' : '4px' }}>
              {!isMe && !isGrouped && (
                <div className="row align-center gap-2 mb-1" style={{ marginLeft: '12px' }}>
                  <span className="text-xs font-bold" style={{ color: msg.senderId === 'nexify_ai' ? 'var(--primary)' : 'inherit' }}>
                    {msg.senderId === 'nexify_ai' ? 'Nexify AI' : (memberProfiles[msg.senderId]?.displayName || 'User')}
                  </span>
                  {msg.senderId === 'nexify_ai' ? (
                    <div style={{ background: 'var(--primary-gradient)', padding: '2px 6px', borderRadius: 6, fontSize: 8, fontWeight: 900, color: 'black' }}>NEXIFY AI</div>
                  ) : (
                    memberProfiles[msg.senderId]?.role && memberProfiles[msg.senderId].role !== 'member' && (
                      <RoleBadge role={memberProfiles[msg.senderId].role} size="xs" />
                    )
                  )}
                </div>
              )}
              <motion.div 
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenu({ id: msg.id, x: Math.min(window.innerWidth - 160, e.clientX), y: Math.min(window.innerHeight - 200, e.clientY), msg });
                }}
                style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: '18px',
                  borderBottomRightRadius: isMe ? (isGrouped ? '4px' : '4px') : '18px',
                  borderBottomLeftRadius: !isMe ? (isGrouped ? '4px' : '4px') : '18px',
                  borderTopRightRadius: isMe && isGrouped ? '4px' : '18px',
                  borderTopLeftRadius: !isMe && isGrouped ? '4px' : '18px',
                  background: msg.senderId === 'nexify_ai' ? 'rgba(0,223,216,0.1)' : (isMe ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.06)'),
                  border: msg.senderId === 'nexify_ai' ? '1px solid var(--primary)' : (isMe ? 'none' : '1px solid rgba(255,255,255,0.05)'),
                  color: 'white',
                  position: 'relative',
                  boxShadow: msg.senderId === 'nexify_ai' ? '0 0 20px rgba(0,223,216,0.2)' : (isMe ? '0 4px 12px rgba(0,223,216,0.15)' : 'none'),
                  animation: msg.senderId === 'nexify_ai' ? 'aiPulse 3s infinite alternate' : 'none'
                }}
              >
                {msg.isPinned && (
                  <div style={{ position: 'absolute', top: -8, left: isMe ? 'auto' : -4, right: isMe ? -4 : 'auto', background: '#000', border: '1px solid var(--primary)', borderRadius: '50%', padding: 4, zIndex: 2 }}>
                    <Pin size={8} color="var(--primary)" />
                  </div>
                )}

                {msg.type === 'text' && <p style={{ fontSize: 14, wordBreak: 'break-word', lineHeight: 1.5 }}>{msg.text}</p>}

                {msg.type === 'image' && (
                  <img src={msg.mediaURL} alt="attachment" style={{ maxWidth: '100%', borderRadius: '12px', marginBottom: '4px' }} />
                )}

                {msg.type === 'gif' && (
                  <img src={msg.mediaURL} alt="gif" style={{ maxWidth: '100%', borderRadius: '12px', marginBottom: '4px' }} />
                )}

                {msg.type === 'file' && (
                  <div className="row align-center gap-3 p-3" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', marginBottom: '4px' }}>
                    <FileText size={24} color="var(--primary)" />
                    <div className="col">
                      <span className="text-xs font-bold truncate" style={{ maxWidth: '150px' }}>{msg.fileName}</span>
                      <span style={{ fontSize: '10px', opacity: 0.7 }}>{(msg.fileSize / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                )}

                {/* Reactions Display */}
                {msg.reactions && Object.keys(msg.reactions).some(k => msg.reactions[k]?.length > 0) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                    {Object.entries(msg.reactions).map(([emoji, uids]) => uids?.length > 0 && (
                      <div 
                        key={emoji} 
                        onClick={(e) => { e.stopPropagation(); handleReact(msg.id, emoji); }}
                        style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 10, fontSize: 10, border: uids.includes(currentUser.uid) ? '1px solid var(--primary)' : '1px solid transparent', display: 'flex', alignItems: 'center', gap: 2 }}
                      >
                        {emoji} {uids.length}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ fontSize: '9px', textAlign: 'right', marginTop: '4px', opacity: 0.5, fontWeight: 700 }}>{time}</div>
              </motion.div>
            </div>
          );
        })}

        <AnimatePresence>
          {showPins && <PinnedMessagesSheet pins={pinnedMessages} onClose={() => setShowPins(false)} />}
          {activeMenu && (
            <>
              <div onClick={() => setActiveMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 999 }} />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{ 
                  position: 'fixed', top: activeMenu.y, left: activeMenu.x, zIndex: 1000, 
                  background: '#111', borderRadius: 16, padding: 8, border: '1px solid rgba(255,255,255,0.1)', 
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)', minWidth: 160 
                }}
              >
                <div style={{ display: 'flex', gap: 6, marginBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '4px 8px 8px' }}>
                  {REACTION_EMOJIS.map(e => (
                    <motion.button 
                      key={e} 
                      whileTap={{ scale: 0.8 }}
                      onClick={() => handleReact(activeMenu.id, e)} 
                      style={{ fontSize: 18, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {e}
                    </motion.button>
                  ))}
                </div>
                <button onClick={() => handleTogglePin(activeMenu.msg)} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', fontSize: 13, background: 'none', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderRadius: 8 }}>
                  <Pin size={16} color="var(--primary)" /> 
                  <span style={{ fontWeight: 600 }}>{activeMenu.msg.isPinned ? 'Unpin Message' : 'Pin Message'}</span>
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        {isUploading && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <div className="pop-in" style={{ padding: '10px 14px', borderRadius: '16px', borderBottomRightRadius: '4px', background: 'var(--primary-gradient)', color: 'white', opacity: 0.8 }}>
              {uploadPreview && (
                <img src={uploadPreview} alt="preview" style={{ maxWidth: '100%', width: '150px', borderRadius: '8px', marginBottom: '4px' }} />
              )}
              <span className="text-xs" style={{ display: 'block', textAlign: 'right' }}>Uploading... {Math.round(uploadProgress)}%</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showGifs && (
        <div className="glass-panel p-2 fade-in" style={{ position: 'absolute', bottom: '70px', left: '16px', right: '16px', borderRadius: 'var(--radius-lg)', zIndex: 20 }}>
          <div className="row flex-between mb-2">
            <span className="text-sm font-bold pl-2">GIFs</span>
            <button className="icon-btn" onClick={() => setShowGifs(false)}>✕</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
            {MOCK_GIFS.map((g, i) => (
              <img key={i} src={g} alt="" style={{ width: '100%', borderRadius: '8px', cursor: 'pointer' }} onClick={() => handleGifSelect(g)} />
            ))}
          </div>
        </div>
      )}

      {/* AI Smart Replies */}
      {messages.length > 0 && !text.trim() && !isUploading && (
        <div className="row gap-2 px-2 pb-2 fade-in" style={{ overflowX: 'auto', whiteSpace: 'nowrap', zIndex: 10 }}>
          <span className="text-xs text-primary font-bold flex-center ml-1 mr-1"><Sparkles size={14} /></span>
          {SMART_REPLIES.map((reply, i) => (
            <button
              key={i}
              onClick={() => setText(reply)}
              className="ripple"
              style={{ padding: '6px 12px', borderRadius: '16px', background: 'rgba(0, 223, 216, 0.1)', border: '1px solid rgba(0,223,216,0.3)', color: 'var(--primary)', fontSize: '11px', whiteSpace: 'nowrap' }}
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <div className="glass-panel row align-center p-2" style={{ borderBottom: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0, paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 20px))', zIndex: 10 }}>
        <button className="icon-btn" onClick={() => showToast('More actions coming soon')}><Plus size={20} className="text-muted" /></button>
        <button className="icon-btn" onClick={() => setShowGifs(!showGifs)}><Smile size={20} className="text-muted" /></button>

        <label className="icon-btn" style={{ cursor: 'pointer', margin: 0 }}>
          <Paperclip size={20} className="text-muted" />
          <input type="file" hidden onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx,.txt" />
        </label>

        <input
          type="text"
          placeholder="Message room..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: 'none', padding: '10px 16px', borderRadius: 'var(--radius-full)', color: 'white', outline: 'none', marginLeft: '4px', marginRight: '4px' }}
        />

        {text.trim() || isSending ? (
          <button className="icon-btn ripple" onClick={handleSend} disabled={isSending} style={{ background: 'var(--gradient-primary)', color: 'white', opacity: isSending ? 0.5 : 1 }}>
            <Send size={18} style={{ marginLeft: '-2px' }} />
          </button>
        ) : (
          <button className="icon-btn" onClick={() => showToast('Voice notes coming soon')}>
            <Mic size={20} className="text-muted" />
          </button>
        )}
      </div>
    </div>
  );
};

export default RoomChat;
