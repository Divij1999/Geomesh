
import React, { useState, useEffect, useRef } from 'react';
import { UserIdentity, GeoLocation } from './types.ts';
import { getCurrentPosition, getH3Index, getNeighbors, formatH3 } from './utils/location.ts';
import { generateIdentity } from './utils/crypto.ts';
import { useGeoSwarm } from './hooks/useGeoSwarm.ts';
import { Identicon } from './components/Identicon.tsx';
import { Radar } from './components/Radar.tsx';

const App: React.FC = () => {
  const [identity, setIdentity] = useState<(UserIdentity & { privateKey: CryptoKey }) | null>(null);
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [showRadar, setShowRadar] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { activePeers, messages, sendMessage } = useGeoSwarm(
    location?.h3Index || '', 
    location?.neighbors || [],
    identity
  );

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const id = await generateIdentity();
        if (!isMounted) return;
        setIdentity(id);
        
        const pos = await getCurrentPosition();
        if (!isMounted) return;
        
        const index = getH3Index(pos.coords.latitude, pos.coords.longitude);
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          h3Index: index,
          neighbors: getNeighbors(index)
        });
      } catch (err: any) {
        if (isMounted) setErrorType(err.message);
      }
    };
    init();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    sendMessage(inputValue.trim());
    setInputValue('');
  };

  if (errorType) {
    return (
      <div className="boot-screen" style={{padding: '40px'}}>
        <h2 style={{color: '#ef4444', marginBottom: '10px'}}>Access Denied</h2>
        <p style={{fontSize: '14px', color: '#667781', marginBottom: '20px'}}>
          GeoMesh requires GPS to find peers in your hexagon.
        </p>
        <button onClick={() => window.location.reload()} className="primary-btn">Retry Access</button>
      </div>
    );
  }

  if (!location || !identity) return (
    <div className="boot-screen">
      <div className="loader"></div>
      <div className="boot-status">Finding your hexagon...</div>
    </div>
  );

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-left">
          <Identicon seed={identity.id} size={40} />
          <div className="logo-container">
            <h1 className="logo-text">GeoMesh</h1>
            <button onClick={() => setShowRadar(!showRadar)} className="zone-badge">
              <span className="ping-dot"></span>
              Zone {formatH3(location.h3Index)}
            </button>
          </div>
        </div>
        <div className="header-right">
          <div style={{display: 'flex', marginRight: '8px'}}>
             {activePeers.slice(0, 2).map(p => (
               <Identicon key={p.id} seed={p.id} size={24} style={{marginLeft: '-10px', border: '2px solid var(--wa-teal)'}} />
             ))}
          </div>
          <button onClick={() => setShowHelp(true)} style={{background: 'none', border: 'none', color: 'white', cursor: 'pointer'}}>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
               <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
             </svg>
          </button>
        </div>
      </header>

      {showRadar && (
        <div style={{ position: 'absolute', top: '60px', left: 0, right: 0, zIndex: 200, padding: '10px' }}>
          <Radar currentH3={location.h3Index} neighbors={location.neighbors} />
        </div>
      )}

      {showHelp && (
        <div className="modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Mesh Privacy</h3>
            <p style={{fontSize: '14px', lineHeight: '1.5', color: '#3b4a54'}}>
              You are currently in Hexagon <strong>{formatH3(location.h3Index)}</strong>.<br/><br/>
              • No central server stores your chats.<br/>
              • Identity is generated locally via Crypto API.<br/>
              • Location precision is limited to ~1.2km cells.
            </p>
            <button onClick={() => setShowHelp(false)} className="primary-btn">Got it</button>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📡</div>
            <p style={{fontSize: '14px', fontWeight: '500'}}>No messages yet</p>
            <p style={{fontSize: '12px', marginTop: '4px'}}>Be the first to broadcast in your area.</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`message-wrapper ${msg.isMe ? 'me' : 'other'}`}>
            <div className="message-content">
              <div className="message-bubble">
                {!msg.isMe && <div className="sender-name">~{msg.senderName.split('_')[0]}</div>}
                {msg.text}
                <div className="message-meta">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {msg.isMe && <span style={{color: '#53bdeb', fontSize: '12px'}}>✓✓</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="input-area">
        <div className="input-container">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend(e)}
            placeholder="Type a message..."
            className="text-input"
          />
        </div>
        <button 
          onClick={handleSend} 
          disabled={!inputValue.trim()} 
          className="send-btn"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default App;
