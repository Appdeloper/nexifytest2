import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { getUserData } from '../services/users';
import { 
  createCallDocument, listenForIncomingCalls, listenToCallDocument, 
  acceptCall, declineCall, endCall, updateCallOffer, updateCallAnswer, 
  addIceCandidate, subscribeIceCandidates 
} from '../services/calls';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, MessageSquare, Camera, Plus, Sparkles } from 'lucide-react';
import { useToast } from './ToastProvider';

const CallContext = createContext();

export const useCall = () => useContext(CallContext);

export const CallProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  
  const [callState, setCallState] = useState('idle'); // idle, ringing, incoming, connected
  const [currentCall, setCurrentCall] = useState(null);
  const [peerUser, setPeerUser] = useState(null);
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [timer, setTimer] = useState(0);

  const pcRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const callUnsubRef = useRef(null);
  const iceUnsubRef = useRef(null);
  const ringTimeoutRef = useRef(null);

  // Setup listener for incoming calls
  useEffect(() => {
    if (!currentUser) return;
    
    const unsub = listenForIncomingCalls(currentUser.uid, async (callData) => {
      setCallState((prev) => {
        if (prev === 'idle') {
          // fetch caller data without awaiting here to prevent async bugs inside setCallState
          getUserData(callData.callerId).then(caller => {
            setPeerUser(caller);
            setCurrentCall(callData);
          }).catch(console.error);
          return 'incoming';
        }
        return prev;
      });
    });
    return () => unsub();
  }, [currentUser]);

  // Handle stream attachment to refs
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState]);

  // Call timer
  useEffect(() => {
    if (callState === 'connected') {
      timerIntervalRef.current = setInterval(() => setTimer(prev => prev + 1), 1000);
    } else {
      clearInterval(timerIntervalRef.current);
      setTimer(0);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [callState]);

  const initWebRTC = async (isCaller, callType) => {
    const servers = {
      iceServers: [
        { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
      ]
    };
    
    const pc = new RTCPeerConnection(servers);
    pcRef.current = pc;
    
    // Get Local Media
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true
      });
      setLocalStream(stream);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    } catch (e) {
      console.error('Media error', e);
      showToast('Microphone/Camera permission denied.');
      cleanupCall();
      return false;
    }

    // Remote Stream
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      setRemoteStream(stream);
    };

    return pc;
  };

  const startVoiceCall = async (receiverUid) => {
    await initiateCall(receiverUid, 'voice');
  };

  const startVideoCall = async (receiverUid) => {
    await initiateCall(receiverUid, 'video');
  };

  const initiateCall = async (receiverUid, type) => {
    if (!currentUser) return;
    
    const peer = await getUserData(receiverUid);
    setPeerUser(peer);
    
    const callId = await createCallDocument(currentUser.uid, receiverUid, type);
    const callData = { callId, type, callerId: currentUser.uid, receiverId: receiverUid, status: 'ringing' };
    
    setCurrentCall(callData);
    setCallState('ringing');
    
    // Auto timeout after 30 seconds
    ringTimeoutRef.current = setTimeout(async () => {
      if (pcRef.current) {
        await declineCall(callId);
        cleanupCall();
      }
    }, 30000);

    const pc = await initWebRTC(true, type);
    if (!pc) return;

    // ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addIceCandidate(callId, event.candidate, 'caller');
      }
    };

    // Create Offer
    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type
    };
    await updateCallOffer(callId, offer);

    // Listen to call doc for answer and status changes
    callUnsubRef.current = listenToCallDocument(callId, async (data) => {
      if (!data) return;
      setCurrentCall(data);
      
      if (data.status === 'declined' || data.status === 'ended' || data.status === 'missed') {
        cleanupCall();
      }

      if (data.status === 'accepted' && data.answer && !pc.currentRemoteDescription) {
        clearTimeout(ringTimeoutRef.current);
        const answerDescription = new RTCSessionDescription(data.answer);
        await pc.setRemoteDescription(answerDescription);
        setCallState('connected');
        setTimeout(() => showToast('Connecting via WebRTC (Beta)...'), 1500);
      }
    });

    // Listen for remote ICE candidates
    iceUnsubRef.current = subscribeIceCandidates(callId, 'caller', (candidate) => {
      pc.addIceCandidate(new RTCIceCandidate(candidate));
    });
  };

  const handleAcceptCall = async () => {
    if (!currentCall || !currentUser) return;
    const { callId, type, offer } = currentCall;
    
    const pc = await initWebRTC(false, type);
    if (!pc) return;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addIceCandidate(callId, event.candidate, 'receiver');
      }
    };

    await acceptCall(callId);
    setCallState('connected');
    setTimeout(() => showToast('Connecting via WebRTC (Beta)...'), 1500);

    if (offer) {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answerDescription = await pc.createAnswer();
      await pc.setLocalDescription(answerDescription);

      const answer = {
        sdp: answerDescription.sdp,
        type: answerDescription.type
      };
      await updateCallAnswer(callId, answer);
    }

    callUnsubRef.current = listenToCallDocument(callId, (data) => {
      if (!data) return;
      setCurrentCall(data);
      if (data.status === 'ended') {
        cleanupCall();
      }
    });

    iceUnsubRef.current = subscribeIceCandidates(callId, 'receiver', (candidate) => {
      pc.addIceCandidate(new RTCIceCandidate(candidate));
    });
  };

  const handleDeclineCall = async () => {
    if (currentCall) {
      await declineCall(currentCall.callId);
    }
    cleanupCall();
  };

  const handleEndCall = async () => {
    if (currentCall) {
      await endCall(currentCall.callId);
    }
    cleanupCall();
  };

  const cleanupCall = () => {
    clearTimeout(ringTimeoutRef.current);
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setCallState('idle');
    setCurrentCall(null);
    setPeerUser(null);
    setIsMuted(false);
    setIsCameraOff(false);
    
    if (callUnsubRef.current) callUnsubRef.current();
    if (iceUnsubRef.current) iceUnsubRef.current();
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => t.enabled = !t.enabled);
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStream && currentCall?.type === 'video') {
      localStream.getVideoTracks().forEach(t => t.enabled = !t.enabled);
      setIsCameraOff(!isCameraOff);
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  const switchCamera = () => {
    showToast('Switch camera coming soon');
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <CallContext.Provider value={{ startVoiceCall, startVideoCall }}>
      {children}
      
      {/* ── Masterpiece Incoming Call Overlay ── */}
      <AnimatePresence>
        {callState === 'incoming' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ 
              position: 'fixed', inset: 0, 
              background: 'rgba(0,0,0,0.85)', 
              backdropFilter: 'blur(40px) saturate(150%)',
              zIndex: 10000,
              paddingBottom: 'calc(40px + env(safe-area-inset-bottom, 20px))'
            }} 
            className="flex-center col"
          >
            <div className="bg-floating-glow" style={{ '--glow-color': 'var(--primary)', opacity: 0.2 }} />
            
            <div style={{ position: 'relative', marginBottom: 40 }}>
              <motion.div 
                animate={{ 
                  scale: [1, 1.15, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{ position: 'absolute', inset: -20, background: 'var(--primary)', borderRadius: '50%', filter: 'blur(30px)' }}
              />
              <motion.img 
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                src={peerUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${peerUser?.uid}`} 
                alt="" 
                style={{ width: 160, height: 160, borderRadius: '50%', zIndex: 2, position: 'relative', border: '6px solid black', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }} 
              />
            </div>
            
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} style={{ textAlign: 'center', zIndex: 2 }}>
              <h2 className="header-title" style={{ fontSize: 32, marginBottom: 12 }}>{peerUser?.displayName}</h2>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'var(--bg-glass)', padding: '10px 20px', borderRadius: 24, border: '1px solid var(--border-neon)' }}>
                <Sparkles size={16} className="status-online" />
                <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--primary)', letterSpacing: 2 }}>INCOMING {currentCall?.type?.toUpperCase()} CALL</span>
              </div>
            </motion.div>
            
            <div style={{ display: 'flex', gap: 40, alignItems: 'center', marginTop: 'auto', zIndex: 2 }}>
              <div className="col align-center gap-3">
                <motion.button whileTap={{ scale: 0.9 }} onClick={handleDeclineCall} style={{ background: 'var(--primary-pink)', width: 80, height: 80, borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', boxShadow: '0 10px 30px rgba(255,0,128,0.3)' }}>
                  <PhoneOff size={32} />
                </motion.button>
                <span className="sub-header" style={{ fontSize: 11 }}>DECLINE</span>
              </div>
              <div className="col align-center gap-3">
                <motion.button whileTap={{ scale: 0.9 }} onClick={handleAcceptCall} className="call-pulse" style={{ background: 'var(--primary-cyan)', width: 80, height: 80, borderRadius: '50%', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', boxShadow: '0 10px 30px rgba(0,223,216,0.4)' }}>
                  <Phone size={32} />
                </motion.button>
                <span className="sub-header" style={{ fontSize: 11 }}>ACCEPT</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Masterpiece Outgoing Overlay ── */}
        {callState === 'ringing' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'var(--bg-glass-heavy)', backdropFilter: 'blur(35px)', zIndex: 10000 }} 
            className="flex-center col"
          >
            <div className="bg-floating-glow" style={{ opacity: 0.15 }} />
            <motion.div 
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 10, repeat: Infinity }}
              style={{ position: 'relative', marginBottom: 40 }}
            >
              <img src={peerUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${peerUser?.uid}`} alt="" style={{ width: 140, height: 140, borderRadius: '50%', border: '4px solid var(--border-glass)', zIndex: 2, position: 'relative' }} />
              <div className="pulse-ring" style={{ top: -10, left: -10, right: -10, bottom: -10, width: 'auto', height: 'auto' }}></div>
            </motion.div>
            
            <h2 className="header-title" style={{ fontSize: 26, marginBottom: 12 }}>{peerUser?.displayName}</h2>
            <div className="row align-center gap-3">
               <span className="sub-header" style={{ fontSize: 12, color: 'var(--primary)' }}>ESTABLISHING LINK</span>
               <div className="typing-dots" style={{ color: 'var(--primary)' }}><span></span><span></span><span></span></div>
            </div>
            
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleEndCall} style={{ background: 'var(--primary-pink)', width: 72, height: 72, borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', marginTop: 60, boxShadow: '0 10px 25px rgba(255,0,128,0.3)' }}>
              <PhoneOff size={30} />
            </motion.button>
          </motion.div>
        )}

        {/* ── Masterpiece Connected Call Overlay ── */}
        {callState === 'connected' && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            style={{ position: 'fixed', inset: 0, background: 'var(--bg-main)', zIndex: 10000, display: 'flex', flexDirection: 'column' }}
          >
            <div className="bg-floating-glow" style={{ opacity: 0.1 }} />

            {/* Glass Header */}
            <motion.div 
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              style={{ 
                position: 'absolute', top: 'calc(env(safe-area-inset-top, 20px) + 16px)', 
                left: '20px', right: '20px', display: 'flex', 
                justifyContent: 'space-between', alignItems: 'center', zIndex: 100 
              }}
            >
              <div style={{ background: 'var(--bg-glass-heavy)', backdropFilter: 'blur(30px)', border: '1px solid var(--border-glass)', borderRadius: 28, padding: '10px 20px 10px 10px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <img src={peerUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${peerUser?.uid}`} style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid var(--primary)' }} alt="" />
                <div className="col">
                   <div className="header-title" style={{ fontSize: 16 }}>{peerUser?.displayName}</div>
                   <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 900, letterSpacing: 1 }}>{formatTime(timer)}</div>
                </div>
              </div>
              <div style={{ background: 'rgba(0,223,216,0.1)', border: '1px solid var(--border-neon)', borderRadius: 20, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                 <div className="pulse-dot" style={{ background: 'var(--primary)' }}></div>
                 <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--primary)', letterSpacing: 1 }}>SECURE P2P</span>
              </div>
            </motion.div>

            {currentCall?.type === 'voice' ? (
              <div className="flex-1 flex-center col">
                <div style={{ position: 'relative' }} className="flex-center col">
                  <motion.div 
                    animate={{ 
                      boxShadow: [`0 0 20px rgba(0,223,216,0.2)`, `0 0 60px rgba(0,223,216,0.4)`, `0 0 20px rgba(0,223,216,0.2)`]
                    }} 
                    transition={{ repeat: Infinity, duration: 3 }}
                    style={{ width: 180, height: 180, borderRadius: '50%', padding: 6, background: 'var(--grad-premium)', marginBottom: 40 }}
                  >
                    <img src={peerUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${peerUser?.uid}`} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '5px solid #000' }} />
                  </motion.div>
                  
                  <div className="audio-wave mb-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
                      <motion.div 
                        key={i}
                        animate={{ height: [12, 40, 12], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 0.5 + Math.random(), repeat: Infinity }}
                        className="wave-bar" 
                        style={{ background: 'var(--primary)' }}
                      />
                    ))}
                  </div>
                </div>
                <audio ref={remoteVideoRef} autoPlay />
              </div>
            ) : (
              <div className="flex-1" style={{ position: 'relative', overflow: 'hidden' }}>
                <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                
                {/* Masterpiece Self Preview */}
                <motion.div 
                  drag
                  dragConstraints={{ left: -300, right: 0, top: 0, bottom: 500 }}
                  whileHover={{ scale: 1.05 }}
                  style={{ position: 'absolute', top: '130px', right: '20px', width: '130px', height: '200px', background: '#000', borderRadius: '24px', overflow: 'hidden', border: '2px solid var(--border-glass)', boxShadow: '0 20px 60px rgba(0,0,0,0.8)', zIndex: 10 }}
                >
                  <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </motion.div>
              </div>
            )}

            {/* Premium Control Dock */}
            <div style={{ padding: '32px', paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 20px))', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', zIndex: 100 }}>
              <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{ background: 'rgba(25,25,30,0.9)', backdropFilter: 'blur(30px)', border: '1px solid var(--border-glass)', borderRadius: 40, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
              >
                <motion.button whileTap={{ scale: 0.9 }} onClick={toggleMute} style={{ background: isMuted ? 'var(--primary-pink)' : 'rgba(255,255,255,0.06)', width: 56, height: 56, borderRadius: '50%', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isMuted ? <MicOff size={26} /> : <Mic size={26} />}
                </motion.button>
                
                {currentCall?.type === 'video' ? (
                  <motion.button whileTap={{ scale: 0.9 }} onClick={toggleCamera} style={{ background: isCameraOff ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)', width: 56, height: 56, borderRadius: '50%', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isCameraOff ? <VideoOff size={26} /> : <Video size={26} />}
                  </motion.button>
                ) : (
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => showToast('Enhance coming soon')} style={{ background: 'rgba(255,255,255,0.06)', width: 56, height: 56, borderRadius: '50%', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={26} />
                  </motion.button>
                )}

                <motion.button onClick={handleEndCall} whileTap={{ scale: 0.8 }} style={{ background: 'var(--primary-pink)', width: 76, height: 76, borderRadius: '50%', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(255,0,128,0.4)', margin: '0 6px' }}>
                  <PhoneOff size={34} />
                </motion.button>

                <motion.button whileTap={{ scale: 0.9 }} onClick={toggleSpeaker} style={{ background: isSpeakerOn ? 'rgba(0,223,216,0.15)' : 'rgba(255,255,255,0.06)', width: 56, height: 56, borderRadius: '50%', border: 'none', color: isSpeakerOn ? 'var(--primary)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Volume2 size={26} />
                </motion.button>
                
                {currentCall?.type === 'video' ? (
                   <motion.button whileTap={{ scale: 0.9 }} onClick={switchCamera} style={{ background: 'rgba(255,255,255,0.06)', width: 56, height: 56, borderRadius: '50%', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={26} />
                  </motion.button>
                ) : (
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => showToast('Quick chat coming soon')} style={{ background: 'rgba(255,255,255,0.06)', width: 56, height: 56, borderRadius: '50%', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageSquare size={24} />
                  </motion.button>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <style>{`
        .pulse-ring {
          position: absolute;
          width: 160px;
          height: 160px;
          border-radius: 50%;
          background: rgba(0, 223, 216, 0.2);
          animation: pulse 2s infinite;
          top: calc(50% - 160px);
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .audio-wave {
          display: flex;
          align-items: center;
          gap: 8px;
          height: 40px;
        }
        .wave-bar {
          width: 5px;
          height: 12px;
          background: var(--primary);
          border-radius: 4px;
          animation: wave 0.8s ease-in-out infinite alternate;
          box-shadow: 0 0 10px rgba(0,223,216,0.3);
        }
        .wave-bar:nth-child(1) { animation-delay: 0.1s; }
        .wave-bar:nth-child(2) { animation-delay: 0.3s; }
        .wave-bar:nth-child(3) { animation-delay: 0.5s; height: 40px; }
        .wave-bar:nth-child(4) { animation-delay: 0.7s; height: 30px; }
        .wave-bar:nth-child(5) { animation-delay: 0.4s; }
        .wave-bar:nth-child(6) { animation-delay: 0.2s; }
        .wave-bar:nth-child(7) { animation-delay: 0.6s; }
        @keyframes wave {
          0% { transform: scaleY(0.4); opacity: 0.4; }
          100% { transform: scaleY(1.4); opacity: 1; }
        }
      `}</style>
    </CallContext.Provider>
  );
};

export default CallProvider;
