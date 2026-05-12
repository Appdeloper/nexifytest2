import React from 'react';
import { motion } from 'framer-motion';
import PresenceIndicator from './PresenceIndicator';

const PRESENCE_OPTIONS = [
  { id: 'online', label: 'Online', status: 'online' },
  { id: 'away', label: 'Away', status: 'away' },
  { id: 'dnd', label: 'DND', status: 'dnd' }
];

const STATUS_PRESETS = [
  { text: 'Studying', emoji: '📚' },
  { text: 'Gaming', emoji: '🎮' },
  { text: 'Coding', emoji: '💻' },
  { text: 'Vibing', emoji: '🌌' },
  { text: 'Working', emoji: '⚡' }
];

const StatusSelector = ({ currentPresence, currentStatus, onUpdate }) => {
  return (
    <div className="col gap-4 p-2">
      <div className="col gap-2">
        <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: 1 }}>SET PRESENCE</span>
        <div className="row gap-2">
          {PRESENCE_OPTIONS.map(opt => (
            <motion.button
              key={opt.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onUpdate({ presence: opt.id })}
              style={{
                flex: 1, padding: '12px 8px', borderRadius: 14,
                background: currentPresence === opt.id ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                border: currentPresence === opt.id ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                cursor: 'pointer'
              }}
            >
              <PresenceIndicator status={opt.status} size={8} border={1.5} />
              <span style={{ fontSize: 11, fontWeight: 800 }}>{opt.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="col gap-2">
        <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: 1 }}>QUICK STATUS</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {STATUS_PRESETS.map(preset => (
            <motion.button
              key={preset.text}
              whileTap={{ scale: 0.95 }}
              onClick={() => onUpdate({ statusText: preset.text, statusEmoji: preset.emoji })}
              style={{
                padding: '10px 14px', borderRadius: 14,
                background: currentStatus === preset.text ? 'rgba(0, 223, 216, 0.1)' : 'rgba(255,255,255,0.03)',
                border: currentStatus === preset.text ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer'
              }}
            >
              <span style={{ marginRight: 6 }}>{preset.emoji}</span>
              {preset.text}
            </motion.button>
          ))}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onUpdate({ statusText: '', statusEmoji: '' })}
            style={{
              padding: '10px 14px', borderRadius: 14,
              background: 'rgba(255,85,85,0.08)', border: '1px solid rgba(255,85,85,0.2)',
              color: '#ff5555', fontSize: 12, fontWeight: 700, cursor: 'pointer'
            }}
          >
            Clear Status
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default StatusSelector;
