
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
    const init = async () => {
      console.log("GeoMesh: Starting secure boot...");
      try {
        // 1. Generate/Load Identity
        const id = await generateIdentity();
        setIdentity(id);
        
        // 2. Request Location
        console.log("GeoMesh: Requesting high-accuracy GPS fix...");
        const pos = await getCurrentPosition();
        
        const index = getH3Index(pos.coords.latitude, pos.coords.longitude);
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          h3Index: index,
          neighbors: getNeighbors(index)
        });
        console.log("GeoMesh: Mesh established at", index);
      } catch (err: any) {
        console.error("GeoMesh: Boot failed.", err.message);
        setErrorType(err.message);
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

  // Error Recovery UI
  if (errorType) {
    const errorConfigs: Record<string, { title: string; desc: string; icon: string }> = {
      PERMISSION_DENIED: {
        title: "GPS Access Denied",
        desc: "GeoMesh needs location to find peers nearby. Please enable Location Services for this site in your browser settings.",
        icon: "🚫"
      },
      TIMEOUT: {
        title: "GPS Lock Timeout",
        desc: "Could not get a high-accuracy fix. Are you indoors? Try moving near a window or check your device GPS settings.",
        icon: "⏳"
      },
      POSITION_UNAVAILABLE: {
        title: "Position Unavailable",
        desc: "The device could not determine your location. Ensure your GPS is turned on.",
        icon: "📍"
      }
    };

    const config = errorConfigs[errorType] || {
      title: "Mesh Sync Error",
      desc: "An unexpected error occurred during initialization. Please try again.",
      icon: "⚠️"
    };

    return (
      <div className="h-screen flex flex-col items-center justify-center p-10 text-center bg-slate-900 text-white">
        <div className="text-6xl mb-6">{config.icon}</div>
        <h2 className="text-2xl font-black mb-3 text-emerald-500">{config.title}</h2>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-xs">{config.desc}</p>
        <div className="space-y-3 w-full max-w-xs">
          <button onClick={() => window.location.reload()} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform">
            Retry Connection
          </button>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full py-3 text-slate-500 text-xs font-bold uppercase tracking-widest">
            Clear Local Cache
          </button>
        </div>
      </div>
    );
  }

  if (!location || !identity) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-6"></div>
      <div className="text-emerald-500 font-black tracking-widest text-[10px] animate-pulse uppercase">
        Establishing Mesh Context...
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[100dvh] max-w-md mx-auto bg-slate-50 overflow-hidden shadow-2xl relative">
      <header className="bg-white border-b border-slate-100 p-4 z-30 shrink-0 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <Identicon seed={identity.id} size={42} />
          </div>
          <div className="overflow-hidden">
            <h1 className="font-black text-slate-900 text-lg leading-tight">GeoMesh</h1>
            <button onClick={() => setShowRadar(!showRadar)} className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase flex items-center gap-1">
              <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping"></span>
              Zone {formatH3(location.h3Index)}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex -space-x-2 mr-2">
             {activePeers.slice(0, 3).map(p => (
               <div key={p.id} className="ring-2 ring-white rounded-full">
                 <Identicon seed={p.id} size={24} />
               </div>
             ))}
          </div>
          <button onClick={() => setShowHelp(true)} className="p-2 text-slate-300 active:text-slate-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>
        </div>
      </header>

      {showHelp && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowHelp(false)}>
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 space-y-6 shadow-2xl border border-white/20" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🛡️</div>
              <h3 className="text-2xl font-black text-slate-900">Privacy Protocol</h3>
            </div>
            <ul className="space-y-4 text-sm text-slate-600">
              <li className="flex gap-3">
                <span className="shrink-0 text-emerald-500 font-bold">01.</span>
                <p><strong>Decentralized:</strong> Messages are broadcast over a virtual local mesh. No central servers store your data.</p>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 text-emerald-500 font-bold">02.</span>
                <p><strong>K-Anonymity:</strong> Your location is masked to a 1.2km hexagon. No one sees your exact GPS coordinates.</p>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 text-emerald-500 font-bold">03.</span>
                <p><strong>Self-Signed:</strong> Your device owns its private keys. Identicons visually verify your digital signature.</p>
              </li>
            </ul>
            <button onClick={() => setShowHelp(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-lg">Understood</button>
          </div>
        </div>
      )}

      {showRadar && <div className="absolute top-[73px] left-0 right-0 z-20 px-4 animate-in slide-in-from-top duration-300"><Radar currentH3={location.h3Index} neighbors={location.neighbors} /></div>}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4 custom-scroll scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 text-center space-y-3 opacity-60">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-4xl">📡</div>
            <div>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Zone Scanning</p>
              <p className="text-xs">Waiting for proximity pings in {formatH3(location.h3Index)}</p>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
            <div className={`flex max-w-[88%] gap-3 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
              {!msg.isMe && <Identicon seed={msg.senderId} size={32} />}
              <div className="flex flex-col">
                <div className={`px-4 py-3 rounded-2xl text-[15px] shadow-sm leading-snug ${msg.isMe ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white text-slate-900 rounded-bl-none border border-slate-100'}`}>
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                </div>
                <div className={`text-[9px] mt-1.5 font-black flex gap-2 items-center uppercase tracking-tighter ${msg.isMe ? 'justify-end text-slate-400' : 'text-slate-400'}`}>
                  {msg.isVerified ? <span className="text-emerald-500">✓ Verified</span> : <span className="text-red-500">⚠ Error</span>}
                  <span>• {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>• Cell {formatH3(msg.h3Index)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white border-t border-slate-100 shrink-0 pb-8 safe-area-bottom">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Broadcast to local mesh..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-[1.5rem] px-6 py-4 text-slate-900 focus:outline-none focus:ring-2 ring-emerald-500/20 text-base"
          />
          <button type="submit" disabled={!inputValue.trim()} className="w-14 h-14 bg-emerald-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-90 transition-transform disabled:opacity-30 shrink-0">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current rotate-45"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;
