# Private Key Storage Security

## Pitfall
Storing cryptographic private keys (ECDH, RSA, etc.) in localStorage as plaintext JWK. Any XSS attack can steal them, making "end-to-end encryption" meaningless.

## Rule
Private keys must NEVER be stored in localStorage as plaintext.

## Options (best to worst)

### Option A: Memory-only (Best)
```typescript
// Store CryptoKey in memory only
let privateKey: CryptoKey | null = null;

// On page refresh, regenerate from server
async function loadKeys() {
  const resp = await fetch('/api/keys/generate');
  const { publicKey, privateKeyJwk } = await resp.json();
  privateKey = await crypto.subtle.importKey('jwk', privateKeyJwk, { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey']);
}
```

### Option B: Encrypted localStorage (Fallback)
```typescript
import { deriveStorageKey, encryptPrivateKey, decryptPrivateKey } from '@/lib/crypto';

// Encrypt before storing
const storageKey = await deriveStorageKey(userId); // PBKDF2(password, userId)
const encrypted = await encryptPrivateKey(privateKeyJwk, storageKey);
localStorage.setItem(`private_key_${userId}`, encrypted);

// Decrypt when needed
const encrypted = localStorage.getItem(`private_key_${userId}`);
const privateKeyJwk = await decryptPrivateKey(encrypted, storageKey);
const privateKey = await crypto.subtle.importKey('jwk', privateKeyJwk, ...);
```

### Option C: IndexedDB + Encryption (Mobile)
For mobile apps, use expo-secure-store or Android Keystore.

## Migration Path for Existing Users
Always add backward compatibility:
```typescript
async function getPrivateKey(userId: string) {
  const stored = localStorage.getItem(`private_key_${userId}`);
  if (!stored) return null;
  
  try {
    // Try new encrypted format first
    return await decryptStoredKey(stored);
  } catch {
    // Fall back to legacy plaintext JWK
    return await crypto.subtle.importKey('jwk', JSON.parse(stored), ...);
  }
}
```

## Checklist
- [ ] Private keys encrypted with PBKDF2-derived key (≥100k iterations)
- [ ] Backward compatibility for legacy unencrypted keys
- [ ] No plaintext JWK in localStorage
- [ ] Memory-only preferred when possible
