# Invite Code Generation

## Pitfall
Using `Math.random()` to generate invite codes, referral codes, or any security-sensitive token. Math.random() is NOT cryptographically secure — its output is predictable from observed values.

## Rule
Never use Math.random() for security-sensitive tokens. Always use crypto.randomBytes() or crypto.getRandomValues().

## Pattern

```typescript
// BAD: Predictable, weak
function generateCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
  // 4 chars base36 = 1.6M combinations, seed predictable
}

// GOOD: Cryptographically secure
function generateCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase().substring(0, 8);
  // 8 chars hex = 281 trillion combinations, CSPRNG
}
```

## Node.js vs Browser
- **Node.js (API Routes, Fastify)**: `import crypto from 'crypto'; crypto.randomBytes(n)`
- **Browser (Frontend)**: `crypto.getRandomValues(new Uint8Array(n))`
- **Next.js API Routes**: Run in Node.js, so `import crypto from 'crypto'` is fine

## Length Recommendation
| Length | Base | Combinations | Collision Risk |
|--------|------|-------------|----------------|
| 4 | base36 | 1.6M | High |
| 6 | base36 | 2.1B | Medium |
| 8 | hex | 281T | Negligible |
| 12 | hex | 10^21 | None practical |

Recommend: 8-character hex (32 bits of entropy) minimum.

## Deduplication Loop
When generating unique codes, loop with exponential backoff:
```typescript
let code = generateCode();
let retries = 0;
while (await db.checkExists({ code })) {
  code = generateCode();
  if (++retries > 100) throw new Error('Failed to generate unique code');
}
```
