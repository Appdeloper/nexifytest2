import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Music, Play, Pause, SkipForward, SkipBack, 
  Volume2, Repeat, Shuffle, Layers, Search, 
  Plus, Headphones, Radio, Sparkles, Flame, 
  CloudRain, Coffee, Building2, Keyboard, Wind,
  ChevronUp, Heart, Share2, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ToastProvider';
import Header from '../components/Header';
import { MOCK_TRACKS, AMBIENCE_SOUNDS, subscribeMusicRooms } from '../services/waves';

const Waveform = ({ active }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 20 }}>
    {[...Array(4)].map((_, i) => (
      <motion.div
        key={i}
        animate={active ? { height: [5, 20, 10, 18, 5] } : { height: 5 }}
        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
        style={{ width: 3, borderRadius: 2, background: 'var(--primary-cyan)' }}
      />
    ))}
  </div>
);

const NexifyWaves = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [rooms, setRooms] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(MOCK_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAmbience, setActiveAmbience] = useState([]);
  const [showPlayer, setShowPlayer] = useState(false);

  const audioRef = useRef(null);

  useEffect(() => {
    const unsub = subscribeMusicRooms(setRooms);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Playback failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  const toggleAmbience = (id) => {
    setActiveAmbience(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  return (
    <div style={{ height: '100dvh', background: '#000', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div className="stars-bg" />
      
      <Header 
        title="Nexify Waves" 
        showBack 
        rightElement={
          <button className="icon-btn" onClick={() => showToast('Search music disabled in demo')}>
            <Search size={18} />
          </button>
        } 
      />

      <audio ref={audioRef} src={currentTrack.url} loop />
      
      {AMBIENCE_SOUNDS.map(sound => (
        <audio 
          key={sound.id}
          src={sound.url} 
          loop 
          autoPlay={activeAmbience.includes(sound.id)} 
          muted={!activeAmbience.includes(sound.id)}
        />
      ))}

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 160, zIndex: 1 }}>
        {/* Hero Section */}
        <div style={{ padding: '24px 16px' }}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ 
              padding: '32px 24px', borderRadius: 32, overflow: 'hidden', position: 'relative',
              background: 'linear-gradient(135deg, #0a0f1f 0%, #001a33 100%)',
              border: '1px solid rgba(0,223,216,0.2)'
            }}
          >
            <div className="bg-floating-glow" />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Sparkles size={16} color="#00dfd8" />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#00dfd8', letterSpacing: 1 }}>AI MOOD MIX</span>
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Late Night Cyber Vibe</h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>
                Synthesized phonk and lofi beats for your midnight focus session.
              </p>
              <motion.button 
                whileTap={{ scale: 0.95 }}
                style={{ 
                  padding: '12px 24px', borderRadius: 16, background: 'var(--primary-cyan)', 
                  border: 'none', color: 'black', fontWeight: 900, fontSize: 14, cursor: 'pointer'
                }}
              >
                Listen Now
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Music Rooms */}
        <div style={{ padding: '0 16px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Radio size={20} color="var(--primary-cyan)" className="pulse" />
              <h3 style={{ fontSize: 16, fontWeight: 900 }}>LIVE MUSIC ROOMS</h3>
            </div>
            <motion.button 
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 800 }}
            >
              CREATE ROOM
            </motion.button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {[
              { title: 'Lofi Focus Pod', listeners: 124, mood: 'Relax', icon: '🎧', color: '#00dfd8' },
              { title: 'Midnight Phonk', listeners: 89, mood: 'Hype', icon: '🔥', color: '#7928ca' },
              { title: 'Cafe Ambience', listeners: 45, mood: 'Study', icon: '☕', color: '#f59e0b' },
              { title: 'Rainy Night', listeners: 67, mood: 'Chill', icon: '🌧️', color: '#3b82f6' },
            ].map((room, i) => (
              <motion.div
                key={i}
                whileTap={{ scale: 0.98 }}
                style={{ 
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 24, padding: '20px 16px', cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>{room.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{room.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{room.listeners} listening</span>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: room.color, boxShadow: `0 0 8px ${room.color}` }} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Ambience Control */}
        <div style={{ padding: '0 16px 32px' }}>
          <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 16 }}>MIDNIGHT AMBIENCE</h3>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
            {AMBIENCE_SOUNDS.map((sound) => (
              <motion.button
                key={sound.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => toggleAmbience(sound.id)}
                style={{ 
                  minWidth: 100, padding: '16px', borderRadius: 24, 
                  background: activeAmbience.includes(sound.id) ? 'rgba(0,223,216,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${activeAmbience.includes(sound.id) ? 'var(--primary-cyan)' : 'rgba(255,255,255,0.06)'}`,
                  color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: 24 }}>{sound.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 800 }}>{sound.label.toUpperCase()}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Featured Playlists */}
        <div style={{ padding: '0 16px 32px' }}>
          <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 16 }}>FEATURED WAVES</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {MOCK_TRACKS.map((track) => (
              <motion.div
                key={track.id}
                whileTap={{ scale: 0.98 }}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px',
                  background: 'rgba(255,255,255,0.03)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)'
                }}
              >
                <img src={track.cover} style={{ width: 50, height: 50, borderRadius: 12, objectFit: 'cover' }} alt="" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{track.title}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{track.artist}</div>
                </div>
                <Waveform active={isPlaying && currentTrack.id === track.id} />
                <button 
                  className="icon-btn" 
                  onClick={() => {
                    setCurrentTrack(track);
                    setIsPlaying(true);
                  }}
                  style={{ background: 'rgba(255,255,255,0.06)', width: 36, height: 36 }}
                >
                  <Play size={16} fill="white" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mini Player ── */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        onDragEnd={(_, info) => {
          if (info.offset.y < -100) setShowPlayer(true);
        }}
        style={{ 
          position: 'fixed', bottom: 84, left: 16, right: 16, zIndex: 100,
          background: 'rgba(10, 15, 31, 0.95)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
        }}
        onClick={() => setShowPlayer(true)}
      >
        <img src={currentTrack.cover} style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover' }} alt="" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800 }}>{currentTrack.title}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{currentTrack.artist}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="icon-btn" style={{ width: 32, height: 32, background: 'none' }}>
            <SkipBack size={18} />
          </button>
          <button className="icon-btn" style={{ width: 32, height: 32, background: 'var(--primary-cyan)', color: 'black' }} onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}>
            {isPlaying ? <Pause size={18} fill="black" /> : <Play size={18} fill="black" />}
          </button>
          <button className="icon-btn" style={{ width: 32, height: 32, background: 'none' }}>
            <SkipForward size={18} />
          </button>
        </div>
      </motion.div>

      {/* ── Fullscreen Player ── */}
      <AnimatePresence>
        {showPlayer && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ 
              position: 'fixed', inset: 0, zIndex: 1000, background: '#000',
              display: 'flex', flexDirection: 'column'
            }}
          >
            <div style={{ 
              position: 'absolute', inset: 0, opacity: 0.4, filter: 'blur(100px)', zIndex: 0,
              background: `radial-gradient(circle at center, var(--primary-cyan) 0%, transparent 70%)`
            }} />
            
            <div style={{ padding: '20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
              <button className="icon-btn" onClick={() => setShowPlayer(false)}><ChevronUp size={24} style={{ transform: 'rotate(180deg)' }} /></button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5 }}>PLAYING FROM</div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>AI MOOD MIX</div>
              </div>
              <button className="icon-btn"><MoreVertical size={20} /></button>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 32px', zIndex: 1 }}>
              <motion.div 
                animate={isPlaying ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.6, repeat: Infinity }}
                style={{ width: '100%', aspectRatio: '1/1', borderRadius: 32, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.6)', marginBottom: 40 }}
              >
                <img src={currentTrack.cover} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              </motion.div>

              <div style={{ width: '100%', marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>{currentTrack.title}</h1>
                    <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>{currentTrack.artist}</p>
                  </div>
                  <button className="icon-btn" style={{ background: 'none' }}><Heart size={24} /></button>
                </div>
              </div>

              {/* Fake Progress Bar */}
              <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginBottom: 8, position: 'relative' }}>
                <div style={{ width: '35%', height: '100%', background: 'var(--primary-cyan)', borderRadius: 2, boxShadow: '0 0 10px var(--primary-cyan)' }} />
              </div>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 40 }}>
                <span>1:24</span>
                <span>{currentTrack.duration}</span>
              </div>

              {/* Controls */}
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="icon-btn" style={{ background: 'none' }}><Shuffle size={20} /></button>
                <button className="icon-btn" style={{ background: 'none' }}><SkipBack size={32} /></button>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{ width: 80, height: 80, borderRadius: '50%', background: 'white', color: 'black', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {isPlaying ? <Pause size={36} fill="black" /> : <Play size={36} fill="black" style={{ marginLeft: 6 }} />}
                </motion.button>
                <button className="icon-btn" style={{ background: 'none' }}><SkipForward size={32} /></button>
                <button className="icon-btn" style={{ background: 'none' }}><Repeat size={20} /></button>
              </div>
            </div>

            <div style={{ padding: '32px', display: 'flex', justifyContent: 'space-between', zIndex: 1 }}>
              <button className="icon-btn" style={{ background: 'none' }}><Headphones size={20} /></button>
              <button className="icon-btn" style={{ background: 'none' }}><Share2 size={20} /></button>
              <button className="icon-btn" style={{ background: 'none' }}><Layers size={20} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NexifyWaves;
