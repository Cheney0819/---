# CORS Production Configuration

## Pitfall
Hardcoding CORS origins (e.g., `localhost:3000`) works for development but breaks in production. Many developers forget to make CORS environment-driven.

## Rule
Always configure CORS via environment variable. Never hardcode domain lists.

## Pattern

```typescript
// BAD: Hardcoded origins
await app.register(cors, {
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
});

// GOOD: Environment-driven
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
let corsOrigin: string[] | boolean;
if (allowedOriginsEnv && allowedOriginsEnv.trim()) {
  corsOrigin = allowedOriginsEnv.split(',').map(o => o.trim()).filter(Boolean);
} else {
  // Dev fallback
  corsOrigin = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ];
}

await app.register(cors, {
  origin: corsOrigin,
  credentials: true,
});
```

## .env.example Entry
```
# Comma-separated list of allowed origins (production only)
# Dev: leave empty for localhost fallback
ALLOWED_ORIGINS=""
```

## Production Deployment Checklist
- [ ] Set ALLOWED_ORIGINS to actual domain(s)
- [ ] Use HTTPS only in production
- [ ] Remove 127.0.0.1 entries from production ALLOWED_ORIGINS
- [ ] Test CORS with browser dev tools before going live
