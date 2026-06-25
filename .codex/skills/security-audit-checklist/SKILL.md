# Security Audit Checklist

## Purpose
Ensure every code review catches common security pitfalls. Reference this checklist before declaring a review complete.

## Checklist

### Authentication & Authorization
- [ ] JWT secrets are cryptographically random (≥256 bits / 32 bytes)
- [ ] JWT has complete claims: `iss`, `aud`, `sub`, `jti`, `iat`, `exp`
- [ ] JWT expiry is short-lived (≤24 hours) with refresh token mechanism
- [ ] Algorithm is anchored (e.g., `verify: { algorithms: ['HS256'] }`)
- [ ] No hardcoded credentials in source code or .env committed to git
- [ ] Password hashing uses bcrypt with proper salt rounds (≥10)

### Cryptography
- [ ] Private keys are NEVER stored in localStorage plaintext
- [ ] If persistent storage is needed: encrypt with PBKDF2-derived key (≥100k iterations)
- [ ] IV/nonce is generated with CSPRNG (crypto.getRandomValues), NOT Math.random()
- [ ] ECDH key exchange uses HKDF or PBKDF2 for key derivation (not raw shared secret)
- [ ] Forward secrecy is considered (Double Ratchet for chat apps)
- [ ] Public key uploads are validated (format, length, validity)

### Input Validation
- [ ] All user inputs validated with Zod schema (never `z.any()`)
- [ ] `request.body as Type` type assertions replaced with `.parse()`
- [ ] File uploads have size limits (bodyLimit + multipart)
- [ ] String inputs have length limits (prevent memory exhaustion)
- [ ] Prototype pollution vectors checked (__proto__, constructor.prototype)

### Transport Security
- [ ] CORS origin is a whitelist, NOT `origin: true` with `credentials: true`
- [ ] Production CORS configured via environment variable (ALLOWED_ORIGINS)
- [ ] WebSocket connections use wss:// in production
- [ ] Content-Security-Policy headers configured
- [ ] HTTP security headers (Helmet/X-Frame-Options/X-Content-Type-Options)

### Rate Limiting
- [ ] Login endpoint has rate limiting
- [ ] Registration endpoint has rate limiting (separate from login)
- [ ] Search endpoint has rate limiting
- [ ] Rate limiter has memory cap (LRU/MaxEntries) to prevent unbounded growth
- [ ] IP-based rate limiting accounts for X-Forwarded-For proxy scenarios

### Error Handling
- [ ] Error handlers log error.message only, NOT full error objects (prevents stack trace leakage)
- [ ] Consistent error response format across all endpoints
- [ ] Database errors caught and mapped to user-friendly messages
- [ ] No sensitive data in console.log in production

### Database
- [ ] Indexes added for frequently queried columns (deletedAt, status, pairId, etc.)
- [ ] Soft delete patterns use indexed deletedAt column
- [ ] Foreign keys have appropriate ON DELETE behavior (CASCADE/SET NULL)
- [ ] Enum fields use Prisma Enum type, not String
- [ ] Unique constraints prevent duplicate records
- [ ] Prisma schema is single source of truth (no duplication across packages)

### Race Conditions
- [ ] Check-then-act patterns wrapped in try-catch for unique constraint violations
- [ ] Atomic operations used where possible (updateMany with status filter)
- [ ] Concurrent registration/creation handled gracefully

### Mobile Native
- [ ] React Native components use <View>/<Text>, NOT <div>/<h1>/<p>
- [ ] expo-secure-store used for sensitive data on mobile
- [ ] Native bridge calls validated

### Environment
- [ ] .env files are in .gitignore
- [ ] .env.example contains placeholder values, NOT real credentials
- [ ] Production secrets managed via CI/CD (Vercel env, AWS Secrets Manager, etc.)
