'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initEncryption, getPrivateKey, deriveSharedKey, encryptMessage, decryptMessage, importPublicKey } from '@/lib/crypto';
import { keysApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

interface EncryptionContextType {
  isInitialized: boolean;
  encrypt: (plaintext: string, partnerPublicKey: string) => Promise<string>;
  decrypt: (ciphertext: string, senderPublicKey: string) => Promise<string>;
  publicKey: string | null;
}

const EncryptionContext = createContext<EncryptionContextType>({
  isInitialized: false,
  encrypt: async () => '',
  decrypt: async () => '',
  publicKey: null,
});

export function EncryptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  useEffect(() => {
    initializeEncryption();
  }, [user]);

  const initializeEncryption = async () => {
    if (!user) return;
    
    try {
      // 检查是否已有本地密钥
      const existingKey = localStorage.getItem(`public_key_${user.id}`);
      
      if (existingKey) {
        setPublicKey(existingKey);
        // 已有公钥，上传到服务器
        const token = useAuthStore.getState().token;
        if (token) {
          await keysApi.uploadPublicKey(existingKey, token);
        }
      } else {
        // 生成新密钥对
        const { publicKey: newPublicKey } = await initEncryption(user.id);
        setPublicKey(newPublicKey);
        localStorage.setItem(`public_key_${user.id}`, newPublicKey);
        // 新生成的公钥，上传到服务器
        const token = useAuthStore.getState().token;
        if (token) {
          await keysApi.uploadPublicKey(newPublicKey, token);
        }
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Encryption initialization failed:', error);
    }
  };

  const encrypt = async (plaintext: string, partnerPublicKey: string): Promise<string> => {
    if (!user) return plaintext;
    
    const privateKey = await getPrivateKey(user.id);
    if (!privateKey) return plaintext;
    
    const partnerKey = await importPublicKey(partnerPublicKey);
    const sharedKey = await deriveSharedKey(privateKey, partnerKey);
    
    return await encryptMessage(sharedKey, plaintext);
  };

  const decrypt = async (ciphertext: string, senderPublicKey: string): Promise<string> => {
    if (!user) return ciphertext;
    
    const privateKey = await getPrivateKey(user.id);
    if (!privateKey) return ciphertext;
    
    const senderKey = await importPublicKey(senderPublicKey);
    const sharedKey = await deriveSharedKey(privateKey, senderKey);
    
    return await decryptMessage(sharedKey, ciphertext);
  };

  return (
    <EncryptionContext.Provider value={{ isInitialized, encrypt, decrypt, publicKey }}>
      {children}
    </EncryptionContext.Provider>
  );
}

export function useEncryption() {
  return useContext(EncryptionContext);
}
