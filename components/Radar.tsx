
import React from 'react';
import { formatH3 } from '../utils/location.ts';

interface RadarProps {
  currentH3: string;
  neighbors: string[];
}

export const Radar: React.FC<RadarProps> = ({ currentH3, neighbors }) => {
  return (
    <div className="radar-container">
      <div className="radar-header">
        <span>Mesh Radar</span>
        <span className="radar-scanning">Scanning Neighbors...</span>
      </div>
      
      <div className="radar-grid">
        {neighbors.slice(0, 6).map((n, i) => (
          <div key={n} className="radar-cell">
            <div className="cell-label">{formatH3(n)}</div>
            <div className="cell-id">Cell {i+1}</div>
          </div>
        ))}
        <div className="radar-cell active">
          <div className="cell-label">Active</div>
          <div className="cell-id">{formatH3(currentH3)}</div>
        </div>
      </div>

      <div className="radar-ping" style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '12rem',
        height: '12rem',
        border: '1px solid rgba(16, 185, 129, 0.1)',
        borderRadius: '50%',
        animation: 'radar-ping 3s linear infinite',
        pointerEvents: 'none'
      }}></div>
      
      <style>{`
        @keyframes radar-ping {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.5; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
