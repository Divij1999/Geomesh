
import React from 'react';

interface IdenticonProps {
  seed: string;
  size?: number;
}

export const Identicon: React.FC<IdenticonProps> = ({ seed, size = 40 }) => {
  // Simple deterministic color generation from string
  const getHashColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
  };

  const bgColor = getHashColor(seed);
  
  return (
    <div 
      className="flex items-center justify-center rounded-full text-white font-bold overflow-hidden shrink-0 shadow-sm border border-white/20"
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: bgColor,
        fontSize: size * 0.4
      }}
    >
      {seed.substring(0, 2).toUpperCase()}
    </div>
  );
};
