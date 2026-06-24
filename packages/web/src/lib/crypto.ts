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
  
  // 存储私钥到 localStorage
  const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
  localStorage.setItem(`private_key_${userId}`, JSON.stringify(privateKeyJwk));
  
  return { publicKey, privateKey: keyPair.privateKey };
}

// 获取私钥
export async function getPrivateKey(userId: string): Promise<CryptoKey | null> {
  const jwkStr = localStorage.getItem(`private_key_${userId}`);
  if (!jwkStr) return null;
  
  const jwk = JSON.parse(jwkStr);
  return await crypto.subtle.importKey(
    'jwk',
    jwk,
    ALGORITHM,
    true,
    ['deriveKey', 'deriveBits']
  );
}
