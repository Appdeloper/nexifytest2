import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { Camera, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ToastProvider';
import { createRoom } from '../services/rooms';
import { getAllUsers } from '../services/users';

const CreateRoom = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Community');
  const [privacy, setPrivacy] = useState('public');
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  
  const [availableFriends, setAvailableFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      getAllUsers(currentUser.uid).then(setAvailableFriends);
    }
  }, [currentUser]);

  const handleIconChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Icon must be under 5MB');
      return;
    }
    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
  };

  const toggleFriend = (uid) => {
    setSelectedFriends(prev => 
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      showToast('Room name is required');
      return;
    }
    
    try {
      setLoading(true);
      
      const roomId = await createRoom({
        name,
        description,
        type,
        privacy,
        createdBy: currentUser.uid,
        friends: selectedFriends
      }, iconFile);
      
      navigate(`/room-chat/${roomId}`);
    } catch (e) {
      console.error(e);
      showToast('Failed to create room: ' + e.message);
      setLoading(false);
    }
  };

  return (
    <div className="col fade-in" style={{ height: '100vh', background: 'var(--bg-main)' }}>
      <Header title="Create Room" showBack />
      
      <div className="flex-1 col p-4 gap-4" style={{ overflowY: 'auto' }}>
        
        {/* Icon Upload */}
        <div className="flex-center col gap-2 mb-2">
          <label style={{ cursor: 'pointer', position: 'relative' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(255,255,255,0.2)' }} className="flex-center">
              {iconPreview ? (
                <img src={iconPreview} alt="Preview" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <Camera size={24} className="text-muted" />
              )}
            </div>
            <input type="file" hidden accept="image/*" onChange={handleIconChange} />
          </label>
          <span className="text-xs text-muted">Upload Icon (Optional)</span>
        </div>

        {/* Basic Info */}
        <GlassCard className="col gap-3">
          <div className="col gap-1">
            <span className="text-xs font-bold text-muted ml-1">ROOM NAME *</span>
            <input 
              type="text" 
              placeholder="e.g., Midnight Coders" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', padding: '12px', borderRadius: '12px', color: 'white', outline: 'none' }} 
            />
          </div>
          
          <div className="col gap-1">
            <span className="text-xs font-bold text-muted ml-1">DESCRIPTION</span>
            <textarea 
              placeholder="What is this room about?" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', padding: '12px', borderRadius: '12px', color: 'white', outline: 'none', resize: 'none' }} 
            />
          </div>
        </GlassCard>

        {/* Categories */}
        <GlassCard className="col gap-3">
          <div className="col gap-1">
            <span className="text-xs font-bold text-muted ml-1">ROOM TYPE</span>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', padding: '12px', borderRadius: '12px', color: 'white', outline: 'none', appearance: 'none' }}
            >
              <option value="Community">Community</option>
              <option value="Study">Study</option>
              <option value="Gaming">Gaming</option>
              <option value="Focus">Focus</option>
              <option value="Private">Private / Custom</option>
            </select>
          </div>

          <div className="col gap-1">
            <span className="text-xs font-bold text-muted ml-1">PRIVACY</span>
            <div className="row gap-2">
              <button 
                onClick={() => setPrivacy('public')}
                style={{ flex: 1, padding: '10px', borderRadius: '12px', border: privacy === 'public' ? '1px solid var(--primary)' : '1px solid var(--border-glass)', background: privacy === 'public' ? 'rgba(0,223,216,0.1)' : 'transparent', color: 'white', cursor: 'pointer' }}
              >
                Public
              </button>
              <button 
                onClick={() => setPrivacy('private')}
                style={{ flex: 1, padding: '10px', borderRadius: '12px', border: privacy === 'private' ? '1px solid var(--primary)' : '1px solid var(--border-glass)', background: privacy === 'private' ? 'rgba(0,223,216,0.1)' : 'transparent', color: 'white', cursor: 'pointer' }}
              >
                Private
              </button>
            </div>
            <span className="text-xs text-muted ml-1 mt-1">
              {privacy === 'public' ? 'Anyone can discover and join.' : 'Only invited friends can join.'}
            </span>
          </div>
        </GlassCard>

        {/* Add Friends */}
        <GlassCard className="col gap-2 mb-4">
          <span className="text-xs font-bold text-muted ml-1">INVITE FRIENDS</span>
          <div className="col gap-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {availableFriends.length === 0 && <span className="text-xs text-muted pl-1">No friends available to invite.</span>}
            {availableFriends.map(friend => {
              const isSelected = selectedFriends.includes(friend.uid);
              return (
                <div key={friend.uid} onClick={() => toggleFriend(friend.uid)} className="row align-center flex-between p-2" style={{ cursor: 'pointer', background: isSelected ? 'rgba(255,255,255,0.05)' : 'transparent', borderRadius: '8px' }}>
                  <div className="row align-center gap-2">
                    <img src={friend.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.uid}`} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                    <span className="text-sm">{friend.displayName}</span>
                  </div>
                  <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: '1px solid var(--primary)', background: isSelected ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isSelected && <span style={{ color: 'black', fontSize: '12px', fontWeight: 'bold' }}>✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GradientButton onClick={handleCreate} disabled={loading} style={{ marginBottom: '32px' }}>
          {loading ? 'Creating...' : 'Create Room'}
        </GradientButton>

      </div>
    </div>
  );
};

export default CreateRoom;
