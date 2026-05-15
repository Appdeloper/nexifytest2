import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Phone, Video, MoreVertical, Plus, Smile, Mic, Send,
  Paperclip, FileText, ArrowLeft, Check, CheckCheck,
  Reply, Trash2, Copy, X, Download, ChevronDown, Sparkles, Play
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ToastProvider';
import {
  subscribeToMessages, sendTextMessage, sendMediaMessage,
  uploadChatAttachment, sendGifMessage, deleteMessage, addReaction
} from '../services/chat';
import { getUserData } from '../services/users';
import { doc, getDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useCall } from '../components/CallProvider';
import { RoleBadge, RankBadge } from '../components/Badges';

const MOCK_GIFS = [
  "https://media.giphy.com/media/VbnUQpnihPSIgIXuZv/giphy.gif",
  "https://media.giphy.com/media/3o7aD2saalEvTehEXm/giphy.gif",
  "https://media.giphy.com/media/l41YkxvU8c7J7Bba0/giphy.gif",
  "https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif",
];
const SMART_REPLIES = ["Got it! 👍", "Sounds good!", "On my way!", "Can we talk later?"];
const REACTIONS = ['👍','❤️','😂','😮','😢','🔥'];

const formatTime = ts => {
  if (!ts) return '';
  try { return new Date(ts.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
};

/* ── Long-press menu ── */
const MsgMenu = ({ msg, isMe, onReply, onDelete, onCopy, onReact, onClose }) => (
  <div
    style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      padding: '0 0 24px',
    }}
    onClick={onClose}
  >
    <div
      className="slide-up"
      onClick={e => e.stopPropagation()}
      style={{
        background: 'var(--bg-card)', borderRadius: '20px 20px 0 0',
        padding: '16px', width: '100%', maxWidth: 430,
        border: '1px solid rgba(255,255,255,0.07)'
      }}
    >
      {/* Reactions */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
        {REACTIONS.map(r => (
          <button key={r} onClick={() => { onReact(r); onClose(); }}
            style={{ fontSize: 24, background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.1s' }}
          >{r}</button>
        ))}
      </div>
      {/* Actions */}
      {[
        { icon: Reply, label: 'Reply', action: onReply },
        { icon: Copy, label: 'Copy', action: onCopy },
        ...(isMe ? [{ icon: Trash2, label: 'Delete', action: onDelete, red: true }] : []),
      ].map(({ icon: Icon, label, action, red }) => (
        <button key={label} onClick={() => { action(); onClose(); }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 14,
            background: 'none', border: 'none', color: red ? '#ff5555' : 'white',
            padding: '14px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)',
            cursor: 'pointer', fontSize: 15, fontWeight: 600, textAlign: 'left'
          }}
        >
          <Icon size={20} /> {label}
        </button>
      ))}
    </div>
  </div>
);

/* ── Image viewer ── */
const ImageViewer = ({ src, onClose }) => (
  <div onClick={onClose} style={{
    position: 'fixed', inset: 0, zIndex: 300,
    background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center'
  }}>
    <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <X size={20} />
    </button>
    <img src={src} alt="" style={{ maxWidth: '95vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 12 }} onClick={e => e.stopPropagation()} />
    <a href={src} download style={{ position: 'absolute', bottom: 30, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 12, padding: '10px 20px', color: 'white', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
      <Download size={16} /> Download
    </a>
  </div>
);

const ChatConversation = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { startVoiceCall, startVideoCall } = useCall();

  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [text, setText] = useState('');
  const [loadingMsg, setLoadingMsg] = useState(true);
  const [showGifs, setShowGifs] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [menuMsg, setMenuMsg] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [viewerSrc, setViewerSrc] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const scrollRef = useRef(null);
  const typingTimer = useRef(null);

  /* load chat/user */
  useEffect(() => {
    if (!currentUser || !chatId) return;
    const load = async () => {
      const chatDoc = await getDoc(doc(db, 'chats', chatId));
      if (chatDoc.exists()) {
        const data = chatDoc.data();
        const otherId = data.members?.find(id => id !== currentUser.uid);
        if (otherId) setOtherUser(await getUserData(otherId));
      }
    };
    load();
    const unsub = subscribeToMessages(chatId, msgs => {
      setMessages(msgs);
      setLoadingMsg(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      
      // AI Tag Detection
      import('../services/ai').then(({ processAITag }) => {
        processAITag(chatId, false, msgs);
      });
    });

    const unsubChat = onSnapshot(doc(db, 'chats', chatId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const otherId = data.members?.find(id => id !== currentUser.uid);
        if (otherId) {
          setOtherTyping(data.typing?.[otherId] || false);
        }
      }
    });

    return () => { unsub(); unsubChat(); };
  }, [chatId, currentUser]);

  /* typing indicator */
  const handleTyping = useCallback((val) => {
    setText(val);
    if (!val.trim()) return;
    clearTimeout(typingTimer.current);
    // update typing state in firestore
    updateDoc(doc(db, 'chats', chatId), { [`typing.${currentUser.uid}`]: true }).catch(() => {});
    typingTimer.current = setTimeout(() => {
      updateDoc(doc(db, 'chats', chatId), { [`typing.${currentUser.uid}`]: false }).catch(() => {});
    }, 2000);
  }, [chatId, currentUser]);

  /* scroll detection */
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
  };

  const handleSend = async () => {
    if (!text.trim() || isSending) return;
    const msgText = text;
    const reply = replyTo;
    setText('');
    setReplyTo(null);
    setIsSending(true);
    try {
      await sendTextMessage(chatId, currentUser.uid, msgText, reply);
    } catch (e) { showToast(e.message); }
    finally {
      setIsSending(false);
      updateDoc(doc(db, 'chats', chatId), { [`typing.${currentUser.uid}`]: false }).catch(() => {});
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showToast('Max 10MB'); return; }
    setIsUploading(true);
    if (file.type.startsWith('image/')) setUploadPreview(URL.createObjectURL(file));
    uploadChatAttachment(chatId, file,
      p => setUploadProgress(p),
      async url => {
        setIsUploading(false); setUploadPreview(null);
        const type = file.type.startsWith('image/') ? 'image' : 'file';
        await sendMediaMessage(chatId, currentUser.uid, file, type, url);
      },
      err => { setIsUploading(false); setUploadPreview(null); showToast(err.message); }
    );
  };

  const handleGifSelect = async (gifUrl) => {
    setShowGifs(false);
    try { await sendGifMessage(chatId, currentUser.uid, gifUrl); }
    catch { showToast('Failed to send GIF'); }
  };

  const handleDelete = async () => {
    if (!menuMsg) return;
    try { await deleteMessage(chatId, menuMsg.id); }
    catch { showToast('Delete failed'); }
  };

  const handleCopy = () => {
    if (menuMsg?.text) navigator.clipboard?.writeText(menuMsg.text);
    showToast('Copied!');
  };

  const handleReact = async (emoji) => {
    if (!menuMsg) return;
    try { await addReaction(chatId, menuMsg.id, currentUser.uid, emoji); }
    catch { showToast('Reaction failed'); }
  };

  /* ── render ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg-main)', position: 'relative' }}>
      {/* ── Immersive Chat Header ── */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{ 
          display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', 
          background: 'var(--bg-glass-heavy)', backdropFilter: 'blur(30px)', 
          borderBottom: '1px solid var(--border-glass)', flexShrink: 0, zIndex: 100
        }}
      >
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 4 }}>
          <ArrowLeft size={24} />
        </button>
        <div style={{ position: 'relative' }}>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            style={{ borderRadius: '50%', padding: 2, background: 'var(--grad-premium)' }}
          >
            <img src={otherUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser?.uid}`} alt="" style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', border: '2px solid black' }} />
          </motion.div>
          <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
            <PresenceIndicator status={otherUser?.presence} size={14} border={3} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div className="header-title" style={{ fontSize: 16 }}>{otherUser?.displayName || '...'}</div>
            {otherUser?.role && otherUser.role !== 'member' && <RoleBadge role={otherUser.role} size="xs" />}
          </div>
          <div style={{ fontSize: 10, fontWeight: 800, color: otherUser?.online ? 'var(--primary)' : 'var(--text-muted)', letterSpacing: 0.5, marginTop: 2 }}>
            {otherUser?.online ? 'ACTIVE NOW' : 'OFFLINE'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 18, color: 'var(--primary)' }}>
          <motion.button whileTap={{ scale: 0.9 }} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--primary)' }} onClick={() => otherUser?.uid && startVoiceCall(otherUser.uid)}><Phone size={20} /></motion.button>
          <motion.button whileTap={{ scale: 0.9 }} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--primary)' }} onClick={() => otherUser?.uid && startVideoCall(otherUser.uid)}><Video size={20} /></motion.button>
        </div>
      </motion.div>

      {/* Messages */}
      <div ref={scrollRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto', padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {loadingMsg && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 40, borderRadius: 16, width: i%2===0 ? '60%' : '45%', alignSelf: i%2===0 ? 'flex-end' : 'flex-start' }} />)}
          </div>
        )}
        {!loadingMsg && messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: '16px 24px', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>👋</div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>Beginning of your conversation with<br /><strong style={{ color: 'white' }}>{otherUser?.displayName}</strong></p>
            </div>
          </div>
        )}

        {(() => {
          let lastDate = null;
          return messages.map((msg, i) => {
            const isMe = msg.senderId === currentUser.uid;
            const prev = i > 0 ? messages[i-1] : null;
            const isGrouped = prev && prev.senderId === msg.senderId;
            const time = formatTime(msg.createdAt);
            const isDeleted = msg.deleted;
            
            const msgDate = msg.createdAt ? new Date(msg.createdAt.toDate()).toDateString() : null;
            const showDateDivider = msgDate && msgDate !== lastDate;
            lastDate = msgDate;

            return (
              <React.Fragment key={msg.id}>
                {showDateDivider && (
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0', clear: 'both' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 14px', borderRadius: 14, fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: 0.5 }}>
                      {msgDate === new Date().toDateString() ? 'TODAY' : msgDate.toUpperCase()}
                    </div>
                  </div>
                )}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="msg-pop" 
                  style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', marginTop: isGrouped ? 2 : 12 }}
                >
                  {/* AI Badge */}
                  {msg.senderId === 'nexify_ai' && !isGrouped && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, marginLeft: 4 }}>
                      <span className="header-title" style={{ fontSize: 12, color: 'var(--primary)' }}>Nexify AI</span>
                      <div style={{ background: 'var(--grad-premium)', padding: '2px 8px', borderRadius: 8, fontSize: 9, fontWeight: 900, color: 'black' }}>AI CORE</div>
                    </div>
                  )}
                  
                  {/* Reply preview */}
                  {msg.replyTo && (
                    <div style={{ maxWidth: '75%', padding: '8px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: '18px 18px 0 0', marginBottom: -4, borderLeft: '3px solid var(--primary)', fontSize: 12, color: 'var(--text-muted)', backdropFilter: 'blur(15px)' }}>
                      <Reply size={12} style={{ marginRight: 6 }} /> {msg.replyTo.text || '[Media]'}
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    onDoubleClick={() => !isDeleted && setMenuMsg(msg)}
                    className={msg.senderId === 'nexify_ai' ? 'ai-message' : ''}
                    style={{
                      maxWidth: '85%', padding: isDeleted ? '10px 16px' : '14px 18px',
                      borderRadius: '24px',
                      borderBottomRightRadius: isMe ? (isGrouped ? 8 : 8) : 24,
                      borderBottomLeftRadius: !isMe ? (isGrouped ? 8 : 8) : 24,
                      background: isDeleted
                        ? 'rgba(255,255,255,0.03)'
                        : isMe
                          ? 'var(--grad-premium)'
                          : 'var(--bg-glass)',
                      color: 'white', cursor: 'pointer', position: 'relative',
                      border: isDeleted ? '1px solid var(--border-glass)' : '1px solid rgba(255,255,255,0.05)',
                      backdropFilter: isMe ? 'none' : 'blur(20px)',
                      wordBreak: 'break-word',
                      boxShadow: isMe ? '0 10px 30px rgba(0,112,243,0.2)' : 'none',
                    }}
                  >
                    {isDeleted ? (
                      <p style={{ fontSize: 13, color: 'var(--text-dim)', fontStyle: 'italic' }}>🚫 Message deleted</p>
                    ) : (
                      <>
                        {msg.type === 'text' && <p style={{ fontSize: 15, lineHeight: 1.6, fontWeight: 500 }}>{msg.text}</p>}
                        {(msg.type === 'image' || msg.type === 'gif') && (
                          <motion.img
                            whileHover={{ scale: 1.02 }}
                            src={msg.mediaURL} alt=""
                            onClick={() => setViewerSrc(msg.mediaURL)}
                            style={{ maxWidth: '100%', borderRadius: 18, cursor: 'zoom-in', display: 'block', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                          />
                        )}
                        {msg.type === 'voice' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 220, padding: '4px 0' }}>
                            <motion.button 
                              whileTap={{ scale: 0.9 }}
                              style={{ background: isMe ? 'rgba(255,255,255,0.2)' : 'var(--primary)', color: isMe ? 'white' : 'black', border: 'none', borderRadius: '50%', width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                              <Play size={20} fill={isMe ? 'white' : 'black'} style={{ marginLeft: 2 }} />
                            </motion.button>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 3, height: 28 }}>
                              {[0.4, 0.7, 0.5, 0.9, 0.6, 0.3, 0.8, 0.5, 0.7, 0.4, 0.6, 0.8, 0.5, 0.9, 0.4].map((h, i) => (
                                <motion.div 
                                  key={i} 
                                  animate={{ height: [`${h * 100}%`, `${(1-h) * 100}%`, `${h * 100}%`] }}
                                  transition={{ duration: 1 + h, repeat: Infinity }}
                                  style={{ flex: 1, background: isMe ? 'rgba(255,255,255,0.4)' : 'rgba(0,223,216,0.5)', borderRadius: 4 }} 
                                />
                              ))}
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 900, opacity: 0.8 }}>0:12</span>
                          </div>
                        )}
                        {msg.type === 'file' && (
                          <a href={msg.mediaURL} download style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', color: 'white', background: 'rgba(0,0,0,0.2)', borderRadius: 18, padding: '12px 16px' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <FileText size={24} color="var(--primary)" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.fileName}</div>
                              <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 600 }}>{(msg.fileSize/1024).toFixed(1)} KB</div>
                            </div>
                            <Download size={18} style={{ opacity: 0.7 }} />
                          </a>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 8, opacity: 0.7 }}>
                          <span style={{ fontSize: 10, fontWeight: 800 }}>{time}</span>
                          {isMe && <CheckCheck size={14} color={msg.readBy?.length > 1 ? 'var(--primary)' : 'rgba(255,255,255,0.3)'} />}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Reactions Redesign */}
                  {msg.reactions && Object.entries(msg.reactions).length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginTop: -10, zIndex: 1, flexWrap: 'wrap', justifyContent: isMe ? 'flex-end' : 'flex-start', padding: '0 6px' }}>
                      {Object.entries(
                        Object.values(msg.reactions).reduce((acc, r) => { acc[r] = (acc[r]||0)+1; return acc; }, {})
                      ).map(([emoji, count]) => (
                        <motion.span 
                          key={emoji} 
                          whileHover={{ scale: 1.1 }}
                          style={{ fontSize: 12, background: 'var(--bg-glass-heavy)', border: '1px solid var(--border-glass)', borderRadius: 20, padding: '4px 10px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}
                        >
                          {emoji} <span style={{ fontWeight: 900, fontSize: 11, marginLeft: 2 }}>{count > 1 ? count : ''}</span>
                        </motion.span>
                      ))}
                    </div>
                  )}
                </motion.div>
              </React.Fragment>
            );
          });
        })()}

        {otherTyping && (
          <div className="msg-pop" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: 8 }}>
            <div style={{ padding: '8px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.03)' }}>
              <div className="typing-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}

        {isUploading && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ padding: '10px 14px', borderRadius: 18, borderBottomRightRadius: 4, background: 'linear-gradient(135deg,#0070f3,#7928ca)', opacity: 0.75, maxWidth: '70%' }}>
              {uploadPreview && <img src={uploadPreview} alt="" style={{ maxWidth: 150, borderRadius: 8, marginBottom: 6, display: 'block' }} />}
              <div style={{ height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'white', borderRadius: 2, transition: 'width 0.3s' }} />
              </div>
              <span style={{ fontSize: 9, display: 'block', textAlign: 'right', marginTop: 4 }}>Uploading {Math.round(uploadProgress)}%</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom */}
      {showScrollBtn && (
        <button
          onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
          style={{ position: 'absolute', bottom: 90, right: 16, zIndex: 10, background: 'var(--primary-gradient)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,223,216,0.4)' }}
        >
          <ChevronDown size={18} color="white" />
        </button>
      )}

      {/* GIF picker */}
      {showGifs && (
        <div style={{ position: 'absolute', bottom: 75, left: 12, right: 12, background: 'var(--bg-card)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', zIndex: 20, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>GIFs</span>
            <button onClick={() => setShowGifs(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {MOCK_GIFS.map((g, i) => (
              <img key={i} src={g} alt="" style={{ width: '100%', borderRadius: 8, cursor: 'pointer', maxHeight: 100, objectFit: 'cover' }} onClick={() => handleGifSelect(g)} />
            ))}
          </div>
        </div>
      )}

      {/* Smart replies */}
      {messages.length > 0 && !text.trim() && !isUploading && !showGifs && (
        <div style={{ overflowX: 'auto', display: 'flex', gap: 8, padding: '4px 12px', flexShrink: 0 }}>
          <Sparkles size={13} color="var(--primary)" style={{ flexShrink: 0, marginTop: 5 }} />
          {SMART_REPLIES.map((r, i) => (
            <button key={i} onClick={() => setText(r)}
              style={{ whiteSpace: 'nowrap', padding: '5px 12px', borderRadius: 20, background: 'rgba(0,223,216,0.08)', border: '1px solid rgba(0,223,216,0.25)', color: 'var(--primary)', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
            >{r}</button>
          ))}
        </div>
      )}

      {/* Reply preview bar */}
      {replyTo && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <Reply size={14} color="var(--primary)" />
          <span style={{ flex: 1, fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Replying to: {replyTo.text || '[media]'}
          </span>
          <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}><X size={14} /></button>
        </div>
      )}

      {/* Composer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 8px))', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
        <button onClick={() => setShowGifs(!showGifs)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--text-muted)' }}><Smile size={20} /></button>
        <label style={{ cursor: 'pointer', padding: 6, color: 'var(--text-muted)', display: 'flex' }}>
          <Paperclip size={20} />
          <input type="file" hidden onChange={handleFileUpload} accept="image/*,video/*,.pdf,.doc,.docx,.txt" />
        </label>
        <input
          type="text"
          placeholder="Message..."
          value={text}
          onChange={e => handleTyping(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 14px', borderRadius: 22, color: 'white', outline: 'none', fontSize: 14 }}
        />
        {text.trim() ? (
          <button onClick={handleSend} disabled={isSending}
            style={{ background: 'linear-gradient(135deg,#0070f3,#7928ca)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: isSending ? 0.5 : 1, boxShadow: '0 2px 10px rgba(0,112,243,0.4)', flexShrink: 0 }}
          >
            <Send size={17} color="white" />
          </button>
        ) : (
          <button onClick={() => showToast('Voice notes disabled in beta')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--text-muted)' }}
          ><Mic size={20} /></button>
        )}
      </div>

      {/* Long press menu */}
      {menuMsg && (
        <MsgMenu
          msg={menuMsg}
          isMe={menuMsg.senderId === currentUser.uid}
          onReply={() => setReplyTo(menuMsg)}
          onDelete={handleDelete}
          onCopy={handleCopy}
          onReact={handleReact}
          onClose={() => setMenuMsg(null)}
        />
      )}

      {/* Image viewer */}
      {viewerSrc && <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />}
    </div>
  );
};

export default ChatConversation;
