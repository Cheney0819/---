// 端到端加密工具 - 使用 Web Crypto API
// 简化版 Signal Protocol：ECDH 密钥交换 + AES-GCM 加密

const ALGORITHM = {
  name: 'ECDH',
  namedCurve: 'P-256',
};

const ENCRYPTION_ALGORITHM = {
  name: 'AES-GCM',
  length: 256,
};

// 生成密钥对
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    ALGORITHM,
    true,
    ['deriveKey', 'deriveBits']
  );
}

// 导出公钥为 base64
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

// 导入公钥
export async function importPublicKey(base64: string): Promise<CryptoKey> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  
  return await crypto.subtle.importKey(
    'raw',
    bytes,
    ALGORITHM,
    true,
    ['deriveKey', 'deriveBits']
  );
}

// 使用 ECDH 派生共享密钥
export async function deriveSharedKey(
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<CryptoKey> {
  return await crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: publicKey,
    },
    privateKey,
    ENCRYPTION_ALGORITHM,
    false,
    ['encrypt', 'decrypt']
  );
}

// 加密消息
export async function encryptMessage(
  sharedKey: CryptoKey,
  plaintext: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    sharedKey,
    data
  );
  
  // 组合 iv 和加密数据
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  // 转换为 base64
  return btoa(String.fromCharCode(...combined));
}

// 解密消息
export async function decryptMessage(
  sharedKey: CryptoKey,
  ciphertext: string
): Promise<string> {
  try {
    // 从 base64 解码
    const combined = new Uint8Array(
      atob(ciphertext).split('').map(c => c.charCodeAt(0))
    );
    
    // 分离 iv 和加密数据
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    // 解密
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      sharedKey,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return '[解密失败]';
  }
}

// 生成随机密钥对并存储
export async function initEncryption(userId: string): Promise<{
  publicKey: string;
  privateKey: CryptoKey;
}> {
  const keyPair = await generateKeyPair();
  const publicKey = await exportPublicKey(keyPair.publicKey);
  
  // 用 PBKDF2 派生包装密钥，AES-GCM 加密后存储
  const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
  const wrappedKey = await deriveStorageKey(userId);
  const encoder = new TextEncoder();
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const encryptedBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    wrappedKey,
    encoder.encode(JSON.stringify(privateKeyJwk))
  );
  const combined = new Uint8Array(nonce.length + encryptedBuf.byteLength);
  combined.set(nonce);
  combined.set(new Uint8Array(encryptedBuf), nonce.length);
  localStorage.setItem(`private_key_${userId}`, btoa(String.fromCharCode(...combined)));
  
  return { publicKey, privateKey: keyPair.privateKey };
}

// 获取私钥 — Fix: 兼容旧用户未加密的 JWK 格式私钥
export async function getPrivateKey(userId: string): Promise<CryptoKey | null> {
  const stored = localStorage.getItem(`private_key_${userId}`);
  if (!stored) return null;
  try {
    const wrappedKey = await deriveStorageKey(userId);
    const combined = new Uint8Array(
      atob(stored).split('').map(c => c.charCodeAt(0))
    );
    
    // 尝试新格式（加密存储）
    if (combined.length > 12) {
      try {
        const nonce = combined.slice(0, 12);
        const encrypted = combined.slice(12);
        const decryptedBuf = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: nonce },
          wrappedKey,
          encrypted
        );
        const decoder = new TextDecoder();
        const jwkStr = decoder.decode(decryptedBuf);
        const jwk = JSON.parse(jwkStr);
        return await crypto.subtle.importKey(
          'jwk',
          jwk,
          ALGORITHM,
          true,
          ['deriveKey', 'deriveBits']
        );
      } catch {
        // 解密失败，可能是旧格式或未加密的 JWK
      }
    }
    
    // 回退：尝试直接解析为未加密的 JWK（兼容旧用户）
    const jwk = JSON.parse(stored);
    if (jwk.kty && jwk.d) {
      return await crypto.subtle.importKey(
        'jwk',
        jwk,
        ALGORITHM,
        true,
        ['deriveKey', 'deriveBits']
      );
    }
    
    return null;
  } catch {
    return null;
  }
}

async function deriveStorageKey(userId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(`storage-key-${userId}`);
  const masterKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('shiguangjian-storage-salt'),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    masterKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
