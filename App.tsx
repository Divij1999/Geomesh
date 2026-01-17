
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
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [showRadar, setShowRadar] = useState(false);
  const [showPeers, setShowPeers] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { activePeers, messages, sendMessage, clearChat } = useGeoSwarm(
    location?.h3Index || '', 
    location?.neighbors || [],
    identity
  );

  useEffect(() => {
    const init = async () => {
      try {
        const id = await generateIdentity();
        setIdentity(id);
        
        const pos = await getCurrentPosition();
        const index = getH3Index(pos.coords.latitude, pos.coords.longitude);
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          h3Index: index,
          neighbors: getNeighbors(index)
        });
      } catch (err: any) {
        console.error("Init error:", err);
        setError(err.message || "Location permission required for P2P mesh.");
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    sendMessage(inputValue.trim());
    setInputValue('');
  };

  if (error) return (
    <div className="h-screen flex flex-col items-center justify-center p-8 text-center bg-white">
      <div className="text-4xl mb-4">📍</div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Connection Error</h2>
      <p className="text-slate-500 text-sm mb-6">{error}</p>
      <button onClick={() => window.location.reload()} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold">Retry</button>
    </div>
  );

  if (!location || !identity) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <div className="text-emerald-500 font-black tracking-widest text-xs animate-pulse">BOOTING SECURE MESH...</div>
    </div>
  );

  return (
    <div className="flex flex-col h-[100dvh] max-w-md mx-auto bg-slate-50 overflow-hidden shadow-2xl relative">
      <header className="bg-white border-b border-slate-100 p-4 z-30 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowPeers(true)} className="relative active:scale-95 transition-transform shrink-0">
            <Identicon seed={identity.id} size={42} />
          </button>
          <div className="overflow-hidden">
            <h1 className="font-black text-slate-900 text-lg leading-tight">GeoMesh</h1>
            <button onClick={() => setShowRadar(!showRadar)} className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase flex items-center gap-1">
              <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping"></span>
              {formatH3(location.h3Index)}
            </button>
          </div>
        </div>
        <button onClick={() => setShowHelp(true)} className="p-2 text-slate-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </button>
      </header>

      {showHelp && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setShowHelp(false)}>
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black text-slate-900">Security Audit</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex gap-2"><span>🛡️</span> <strong>Topic Salting:</strong> H3 indices are SHA-256 hashed with a salt before joining the swarm.</li>
              <li className="flex gap-2"><span>✍️</span> <strong>Digital Signatures:</strong> Every message is signed with a P-256 ECDSA private key generated on-device.</li>
              <li className="flex gap-2"><span>🕵️</span> <strong>K-Anonymity:</strong> Your location is masked by a ~1.2km hexagonal radius.</li>
            </ul>
            <button onClick={() => setShowHelp(false)} className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-lg">Close</button>
          </div>
        </div>
      )}

      {showRadar && <div className="absolute top-[73px] left-0 right-0 z-20 px-4"><Radar currentH3={location.h3Index} neighbors={location.neighbors} /></div>}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4 custom-scroll">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
            <div className={`flex max-w-[85%] gap-2.5 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
              {!msg.isMe && <Identicon seed={msg.senderId} size={30} />}
              <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${msg.isMe ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white text-slate-900 rounded-bl-none border border-slate-100'}`}>
                <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                <div className={`text-[8px] mt-1.5 font-bold flex gap-2 items-center uppercase ${msg.isMe ? 'text-white/60' : 'text-slate-400'}`}>
                  {msg.isVerified ? <span title="Verified Signature">✓ Signed</span> : <span className="text-red-500">⚠ Unverified</span>}
                  <span>• {formatH3(msg.h3Index)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white border-t border-slate-100 shrink-0 pb-8">
        <form onSubmit={handleSend} className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Broadcast securely..."
            className="flex-1 bg-slate-100 rounded-2xl px-5 py-4 text-slate-900 focus:outline-none focus:ring-2 ring-emerald-500/20"
          />
          <button type="submit" disabled={!inputValue.trim()} className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-transform disabled:opacity-20 shrink-0">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;
