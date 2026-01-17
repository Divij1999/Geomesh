
import React from 'react';
import { formatH3 } from '../utils/location';

interface RadarProps {
  currentH3: string;
  neighbors: string[];
}

export const Radar: React.FC<RadarProps> = ({ currentH3, neighbors }) => {
  return (
    <div className="bg-slate-900 p-6 rounded-3xl mb-4 relative overflow-hidden shadow-inner border border-white/10">
      <div className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-4 flex justify-between">
        <span>Mesh Radar</span>
        <span className="text-emerald-400 animate-pulse">Scanning Neighbors...</span>
      </div>
      
      <div className="flex flex-wrap justify-center gap-2 relative z-10">
        {/* Simple Hex visualization */}
        {neighbors.slice(0, 6).map((n, i) => (
          <div 
            key={n} 
            className="w-16 h-18 bg-white/5 border border-white/10 rounded-lg flex flex-col items-center justify-center p-2 backdrop-blur-sm"
          >
            <div className="text-[8px] text-white/50">{formatH3(n)}</div>
            <div className="text-[10px] text-white font-mono mt-1">Cell {i+1}</div>
          </div>
        ))}
        <div className="w-20 h-22 bg-emerald-500/20 border-2 border-emerald-500 rounded-lg flex flex-col items-center justify-center p-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
          <div className="text-[8px] text-emerald-300 font-bold uppercase">Active</div>
          <div className="text-[10px] text-white font-mono mt-1 font-bold">{formatH3(currentH3)}</div>
        </div>
      </div>

      {/* Decorative pulse */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-emerald-500/10 rounded-full animate-ping pointer-events-none"></div>
    </div>
  );
};
