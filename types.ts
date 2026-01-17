
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderPublicKey: string;
  text: string;
  signature: string;
  timestamp: number;
  h3Index: string;
  isMe?: boolean;
  isVerified?: boolean;
}

export interface Peer {
  id: string;
  name: string;
  publicKey: string;
  lastSeen: number;
  h3Index: string;
}

export interface UserIdentity {
  id: string;
  name: string;
  publicKey: string;
}

export interface GeoLocation {
  lat: number;
  lng: number;
  h3Index: string;
  neighbors: string[];
}
