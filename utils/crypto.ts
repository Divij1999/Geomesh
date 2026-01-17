
import { UserIdentity } from '../types.ts';

const SYSTEM_SALT = "geomesh_v1_proximity_layer";

export const generateIdentity = async (): Promise<UserIdentity & { privateKey: CryptoKey }> => {
  const stored = localStorage.getItem('geomesh_identity_v2');
  
  // We always generate a fresh ephemeral key for this demo's signing session
  // unless we were to store the private key in IndexedDB (localStorage can't store CryptoKey)
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"]
  );

  const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));

  let identity: UserIdentity;
  if (stored) {
    const data = JSON.parse(stored);
    // Keep the name/id if they already exist, but update the public key for the current session
    identity = {
      ...data,
      publicKey: publicKeyBase64
    };
  } else {
    const id = publicKeyBase64.substring(0, 16);
    const names = ["Shadow", "Beacon", "Glider", "Vortex", "Cipher", "Hex", "Drift"];
    const name = `${names[Math.floor(Math.random() * names.length)]}_${Math.floor(Math.random() * 999)}`;
    identity = { id, name, publicKey: publicKeyBase64 };
  }

  localStorage.setItem('geomesh_identity_v2', JSON.stringify(identity));
  
  return {
    ...identity,
    privateKey: keyPair.privateKey
  };
};

export const getDiscoveryTopic = async (h3Index: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(h3Index + SYSTEM_SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
};

export const signMessage = async (text: string, privateKey: CryptoKey): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const signature = await window.crypto.subtle.sign(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    privateKey,
    data
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
};

export const verifyMessage = async (text: string, signatureBase64: string, publicKeyBase64: string): Promise<boolean> => {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const signature = new Uint8Array(atob(signatureBase64).split("").map(c => c.charCodeAt(0)));
    const publicKeyBuffer = new Uint8Array(atob(publicKeyBase64).split("").map(c => c.charCodeAt(0)));
    
    const publicKey = await window.crypto.subtle.importKey(
      "spki",
      publicKeyBuffer,
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["verify"]
    );

    return await window.crypto.subtle.verify(
      { name: "ECDSA", hash: { name: "SHA-256" } },
      publicKey,
      signature,
      data
    );
  } catch (e) {
    return false;
  }
};
