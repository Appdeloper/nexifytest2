import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { RoleBadge } from '../components/Badges';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ToastProvider';
import { 
  Info, Smile, Image as ImageIcon, Send, Paperclip, 
  Sparkles, Pin, MoreVertical, X, Users, Trash2, Copy, Play,
  ArrowLeft
} from 'lucide-react';
import { 
  subscribeGroupMessages, sendGroupTextMessage, sendGroupMediaMessage, 
  sendGroupGifMessage, deleteGroupMessage, addGroupReaction,
  addMemberToGroup, removeMemberFromGroup, uploadChatAttachment
} from '../services/chat';
import { subscribeFriends } from '../services/friends';
import { getUserData } from '../services/users';

const REACTION_EMOJIS = ['❤️', '🔥', '😂', '😮', '😢', '💯'];
const SMART_REPLIES = ['Hey!', 'How are you?', 'Got it! 👍', 'Let\'s go!', 'Focus time ⚡'];

const GroupManagementSheet = ({ members, profiles, groupData, currentUser, onRemove, onInvite, onClose }) => {
  const isAdmin = groupData?.adminId === currentUser.uid;
  const [friends, setFriends] = useState([]);
  
  useEffect(() => {
    const unsub = subscribeFriends(currentUser.uid, async (frList) => {
      const friendIds = frList.map(f => f.users.find(id => id !== currentUser.uid));
      const fetchedProfiles = await Promise.all(friendIds.map(async id => {
         try { return await getUserData(id); } catch { return null; }
      }));
      setFriends(fetchedProfiles.filter(p => p && !members.includes(p.uid)));
    });
    return () => unsub();
  }, [members, currentUser.uid]);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', flexDirection: 'column' }}
    >
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }} />
      <div style={{ 
        position: 'relative', marginLeft: '20%', width: '80%', height: '100%', 
        background: 'var(--bg-glass-heavy)', backdropFilter: 'blur(30px)',
        borderLeft: '1px solid var(--border-glass)',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.5 }}>Group Details</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: 0.8 }}><X size={20} /></button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {/* Invite Section */}
          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--primary)', letterSpacing: 1.5, marginBottom: 16 }}>INVITE CITIZENS</div>
          {friends.length === 0 ? (
            <div style={{ fontSize: 12, opacity: 0.4, marginBottom: 24 }}>No other friends available to invite.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {friends.map(f => (
                <div key={f.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src={f.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.uid}`} style={{ width: 32, height: 32, borderRadius: 10 }} alt="" />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{f.displayName}</span>
                  </div>
                  <button 
                    onClick={() => onInvite(f.uid)}
                    style={{ background: 'var(--primary-gradient)', border: 'none', borderRadius: 6, padding: '4px 10px', color: 'black', fontSize: 10, fontWeight: 900, cursor: 'pointer' }}
                  >
                    INVITE
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--primary)', letterSpacing: 1.5, marginBottom: 16 }}>MEMBERS — {members.length}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {members.map(uid => {
              const p = profiles[uid] || { displayName: 'Loading...' };
              const isUserAdmin = groupData?.adminId === uid;
              const isMe = uid === currentUser.uid;
              
              return (
                <div key={uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                      <img src={p.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`} style={{ width: 40, height: 40, borderRadius: 12, objectFit: 'cover' }} alt="" />
                      {p.online && <div style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, background: '#10b981', border: '2px solid #0a0a0a', borderRadius: '50%' }} />}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{p.displayName}</span>
                        {isUserAdmin && <div style={{ background: 'rgba(155,81,224,0.15)', color: 'var(--primary-purple)', fontSize: 8, padding: '1px 4px', borderRadius: 4, fontWeight: 900 }}>ADMIN</div>}
                        {isMe && <span style={{ fontSize: 10, opacity: 0.4 }}>(You)</span>}
                      </div>
                      <span style={{ fontSize: 11, opacity: 0.5 }}>{p.status || (p.online ? 'Online' : 'Offline')}</span>
                    </div>
                  </div>
                  
                  {isAdmin && !isUserAdmin && !isMe && (
                    <button 
                      onClick={() => onRemove(uid)}
                      style={{ background: 'rgba(255,50,50,0.1)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#ff3232', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                    >
                      REMOVE
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const GroupChat = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [messages, setMessages] = useState([]);
  const [groupData, setGroupData] = useState(null);
  const [memberProfiles, setMemberProfiles] = useState({});
  const [text, setText] = useState('');
  const [loadingMsg, setLoadingMsg] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null); // { id, x, y }

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!currentUser || !groupId) return;

    // 1. Group Data & Members Profiles
    const unsubGroup = onSnapshot(doc(db, 'groups', groupId), async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setGroupData(data);
        
        // Fetch member profiles
        if (data.members?.length > 0) {
          const profiles = {};
          await Promise.all(data.members.map(async (uid) => {
            try {
              const pDoc = await getDoc(doc(db, 'users', uid));
              if (pDoc.exists()) profiles[uid] = pDoc.data();
            } catch (err) {
              console.warn("Failed to fetch profile for member:", uid);
            }
          }));
          setMemberProfiles(profiles);
        }
      } else {
        showToast('Pod not found');
        navigate('/chats');
      }
    });

    // 2. Group Messages
    const unsubMsgs = subscribeGroupMessages(groupId, msgs => {
      setMessages(msgs);
      setLoadingMsg(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => { unsubGroup(); unsubMsgs(); };
  }, [groupId, currentUser, navigate, showToast]);

  const handleSend = async () => {
    if (!text.trim() || isSending) return;
    const msgText = text;
    setText('');
    setIsSending(true);
    try {
      await sendGroupTextMessage(groupId, currentUser.uid, msgText);
    } catch (e) {
      showToast(e.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showToast('Max 10MB'); return; }
    setIsUploading(true);
    if (file.type.startsWith('image/')) setUploadPreview(URL.createObjectURL(file));
    
    uploadChatAttachment(groupId, file,
      p => setUploadProgress(p),
      async url => {
        setIsUploading(false); setUploadPreview(null);
        const type = file.type.startsWith('image/') ? 'image' : 'file';
        await sendGroupMediaMessage(groupId, currentUser.uid, file, type, url);
      },
      err => { setIsUploading(false); setUploadPreview(null); showToast(err.message); }
    );
  };

  const handleDelete = async (messageId) => {
    try {
      await deleteGroupMessage(groupId, messageId);
      showToast('Message deleted');
    } catch {
      showToast('Delete failed');
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      await addGroupReaction(groupId, messageId, currentUser.uid, emoji);
    } catch {
      showToast('Reaction failed');
    }
  };

  const handleRemoveMember = async (targetUid) => {
    try {
      await removeMemberFromGroup(groupId, targetUid);
      showToast('Member removed');
    } catch (e) {
      showToast('Failed to remove member');
    }
  };

  const handleInviteMember = async (targetUid) => {
    try {
      await addMemberToGroup(groupId, targetUid);
      showToast('Member invited');
    } catch (e) {
      showToast('Failed to invite member');
    }
  };

  return (
    <div className="fade-in col" style={{ height: '100%', background: 'var(--bg-dark)', position: 'relative' }}>
      
      {/* ── Appbar Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', borderBottom: '1px solid var(--border-glass)',
        background: 'var(--bg-glass-heavy)', backdropFilter: 'blur(30px)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => navigate('/chats')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}>
            <ArrowLeft size={24} />
          </button>
          
          <img 
            src={groupData?.groupImage || `https://api.dicebear.com/7.x/identicon/svg?seed=${groupId}`} 
            style={{ width: 42, height: 42, borderRadius: 12, border: '2px solid var(--primary-purple)', boxShadow: '0 0 10px rgba(123, 97, 255, 0.2)' }} 
            alt="Pod Avatar" 
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: 16, fontWeight: 900, letterSpacing: -0.3 }}>{groupData?.name || 'Loading...'}</h2>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{groupData?.members?.length || 0} Citizens connected</span>
          </div>
        </div>

        <button 
          onClick={() => setShowMembers(true)} 
          style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Info size={20} />
        </button>
      </div>

      {/* ── Messages Stream ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {loadingMsg ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 30, height: 30, border: '3px solid var(--primary-cyan)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.35 }}>
            <Users size={48} strokeWidth={1} style={{ marginBottom: 12 }} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>Initialize Pod Broadcasts</span>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === currentUser.uid;
            const p = memberProfiles[m.senderId] || { displayName: 'Citizen', photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.senderId}` };
            
            return (
              <div 
                key={m.id || m.messageId} 
                style={{ 
                  display: 'flex', gap: 10,
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  flexDirection: isMe ? 'row-reverse' : 'row'
                }}
              >
                {!isMe && (
                  <img src={p.photoURL} style={{ width: 32, height: 32, borderRadius: 10, alignSelf: 'flex-end', objectFit: 'cover' }} alt="" />
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  {!isMe && (
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary-purple)', marginBottom: 4, marginLeft: 2 }}>{p.displayName}</span>
                  )}
                  
                  <div style={{ position: 'relative', group: 'true' }}>
                    {m.deleted ? (
                      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 16, padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        This transmission was terminated.
                      </div>
                    ) : (
                      <div 
                        onContextMenu={(e) => { e.preventDefault(); setActiveMenu({ id: m.id || m.messageId, x: e.clientX, y: e.clientY }); }}
                        style={{
                          background: isMe ? 'var(--gradient-primary)' : 'var(--bg-card)',
                          color: isMe ? 'black' : 'white',
                          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          border: isMe ? 'none' : '1px solid var(--border-glass)',
                          padding: '12px 16px', fontSize: 13.5, fontWeight: isMe ? 700 : 500,
                          lineHeight: 1.4, wordBreak: 'break-word',
                          boxShadow: isMe ? '0 8px 25px rgba(0, 229, 255, 0.15)' : 'none',
                          backdropFilter: 'blur(20px)'
                        }}
                      >
                        {m.imageUrl || m.mediaURL ? (
                          <img src={m.imageUrl || m.mediaURL} alt="" style={{ maxWidth: '100%', borderRadius: 12, display: 'block', maxHeight: 200 }} />
                        ) : (
                          m.text
                        )}
                        
                        {/* Reactions render */}
                        {m.reactions && Object.keys(m.reactions).length > 0 && (
                          <div style={{ display: 'flex', gap: 4, position: 'absolute', bottom: -12, right: isMe ? 'auto' : 8, left: isMe ? 8 : 'auto', background: 'var(--bg-glass-heavy)', border: '1px solid var(--border-glass)', borderRadius: 10, padding: '2px 6px', color: 'white' }}>
                            {Object.entries(m.reactions).map(([uid, emoji]) => (
                              <span key={uid} style={{ fontSize: 10 }}>{emoji}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Active Long-Press Menu ── */}
      <AnimatePresence>
        {activeMenu && (
          <div 
            onClick={() => setActiveMenu(null)} 
            style={{ position: 'fixed', inset: 0, zIndex: 1999, background: 'rgba(0,0,0,0.1)' }}
          >
            <div style={{
              position: 'fixed', left: Math.min(activeMenu.x, window.innerWidth - 160), top: Math.min(activeMenu.y, window.innerHeight - 150),
              background: '#151515', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '6px',
              display: 'flex', flexDirection: 'column', width: 140, boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
            }} onClick={e => e.stopPropagation()}>
              
              {/* Emoji quick reaction */}
              <div style={{ display: 'flex', gap: 6, padding: '6px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {REACTION_EMOJIS.map(emoji => (
                  <button 
                    key={emoji} 
                    onClick={() => { handleReaction(activeMenu.id, emoji); setActiveMenu(null); }}
                    style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', padding: 0 }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => { 
                  const selectedMsg = messages.find(msg => (msg.id || msg.messageId) === activeMenu.id);
                  if (selectedMsg?.text) navigator.clipboard.writeText(selectedMsg.text);
                  showToast('Copied');
                  setActiveMenu(null);
                }} 
                style={{ background: 'none', border: 'none', color: 'white', textAlign: 'left', padding: '8px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Copy size={13} /> Copy Text
              </button>
              
              <button 
                onClick={() => { handleDelete(activeMenu.id); setActiveMenu(null); }} 
                style={{ background: 'none', border: 'none', color: '#ff3b30', textAlign: 'left', padding: '8px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Trash2 size={13} /> Delete Message
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Input bar and Launcher panels ── */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-glass)', background: 'var(--bg-glass-heavy)', backdropFilter: 'blur(30px)' }}>
        
        {/* Smart reply suggestions */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
          {SMART_REPLIES.map(chip => (
            <button 
              key={chip} 
              onClick={() => setText(chip)}
              style={{ background: 'rgba(0, 229, 255, 0.08)', border: '1px solid rgba(0, 229, 255, 0.25)', borderRadius: 20, padding: '6px 14px', fontSize: 11, fontWeight: 700, color: 'var(--primary-cyan)', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {chip}
            </button>
          ))}
        </div>

        {uploadPreview && (
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 10 }}>
            <img src={uploadPreview} style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover' }} alt="" />
            <button 
              onClick={() => setUploadPreview(null)} 
              style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: 'black', color: 'white', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 9 }}
            >
              ✕
            </button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ cursor: 'pointer', width: 38, height: 38, borderRadius: '50%', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-glass)' }}>
            <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
            <Paperclip size={18} color="var(--primary-cyan)" />
          </label>

          <input 
            type="text" 
            placeholder="Broadcast to Pod..." 
            value={text} 
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            style={{ 
              flex: 1, height: 38, background: 'var(--bg-glass)', 
              border: '1px solid var(--border-glass)', borderRadius: 20, 
              color: 'white', padding: '0 16px', outline: 'none', 
              fontSize: 13, fontWeight: 600,
              transition: 'border-color 0.2s'
            }} 
          />

          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={handleSend}
            className="neon-btn"
            style={{ 
              width: 38, height: 38, borderRadius: '50%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              cursor: 'pointer', color: 'black', padding: 0, minWidth: 38
            }}
          >
            <Send size={16} color="black" />
          </motion.button>
        </div>
      </div>

      {/* ── Sliding Member Details panel ── */}
      <AnimatePresence>
        {showMembers && (
          <GroupManagementSheet 
            members={groupData?.members || []}
            profiles={memberProfiles}
            groupData={groupData}
            currentUser={currentUser}
            onRemove={handleRemoveMember}
            onInvite={handleInviteMember}
            onClose={() => setShowMembers(false)}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default GroupChat;
