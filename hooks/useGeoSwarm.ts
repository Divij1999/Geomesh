
import { useState, useEffect, useCallback, useRef } from 'react';
import { Message, Peer, UserIdentity } from '../types.ts';
import { getDiscoveryTopic, signMessage, verifyMessage } from '../utils/crypto.ts';

const STORAGE_KEY = 'geomesh_chat_history_v2';
const PEER_TIMEOUT = 30000;

export const useGeoSwarm = (h3Index: string, neighbors: string[], identity: (UserIdentity & { privateKey: CryptoKey }) | null) => {
  const [activePeers, setActivePeers] = useState<Peer[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const channelsRef = useRef<Map<string, BroadcastChannel>>(new Map());

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setMessages(JSON.parse(saved).slice(-100));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const handleIncomingMessage = useCallback(async (msg: Message) => {
    const isVerified = await verifyMessage(msg.text, msg.signature, msg.senderPublicKey);
    
    setMessages(prev => {
      if (prev.find(m => m.id === msg.id)) return prev;
      return [...prev, { ...msg, isMe: msg.senderId === identity?.id, isVerified }].sort((a, b) => a.timestamp - b.timestamp);
    });
  }, [identity?.id]);

  useEffect(() => {
    if (!h3Index || !identity) return;

    const setupSwarm = async () => {
      channelsRef.current.forEach(ch => ch.close());
      channelsRef.current.clear();

      const cells = [h3Index, ...neighbors];
      for (const cell of cells) {
        const hashedTopic = await getDiscoveryTopic(cell);
        const channel = new BroadcastChannel(`swarm_${hashedTopic}`);
        
        channel.onmessage = (event) => {
          const { type, payload } = event.data;
          if (type === 'chat') handleIncomingMessage(payload);
          if (type === 'ping' || type === 'pong') {
            setActivePeers(prev => {
              const filtered = prev.filter(p => p.id !== payload.id);
              return [...filtered, { ...payload, lastSeen: Date.now() }];
            });
            if (type === 'ping') {
              channel.postMessage({
                type: 'pong',
                payload: { id: identity.id, name: identity.name, publicKey: identity.publicKey, h3Index }
              });
            }
          }
        };

        channelsRef.current.set(cell, channel);
        channel.postMessage({
          type: 'ping',
          payload: { id: identity.id, name: identity.name, publicKey: identity.publicKey, h3Index }
        });
      }
    };

    setupSwarm();
    const staleCheck = setInterval(() => {
      const now = Date.now();
      setActivePeers(prev => prev.filter(p => now - p.lastSeen < PEER_TIMEOUT));
    }, 10000);

    return () => {
      channelsRef.current.forEach(ch => ch.close());
      clearInterval(staleCheck);
    };
  }, [h3Index, neighbors, identity, handleIncomingMessage]);

  const sendMessage = useCallback(async (text: string) => {
    if (!identity || !h3Index) return;

    const signature = await signMessage(text, identity.privateKey);
    const newMessage: Message = {
      id: Math.random().toString(36).substring(2) + Date.now(),
      senderId: identity.id,
      senderName: identity.name,
      senderPublicKey: identity.publicKey,
      text,
      signature,
      timestamp: Date.now(),
      h3Index,
      isMe: true,
      isVerified: true
    };

    setMessages(prev => [...prev, newMessage]);
    channelsRef.current.forEach(channel => {
      channel.postMessage({ type: 'chat', payload: newMessage });
    });
  }, [identity, h3Index]);

  return { activePeers, messages, sendMessage, clearChat: () => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([]);
  }};
};
