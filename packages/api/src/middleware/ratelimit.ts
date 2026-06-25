import { FastifyRequest, FastifyReply } from 'fastify';

// 简单的内存限流器
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 60 * 1000; // 1分钟
const MAX_REQUESTS = 60; // 最大请求数

// Fix: Map 最大条目数限制，防止内存泄漏
const MAX_RATE_LIMIT_ENTRIES = 10000;

export async function rateLimit(request: FastifyRequest, reply: FastifyReply) {
  const ip = request.ip || request.socket.remoteAddress || 'unknown';
  const now = Date.now();
  
  // 超出最大条目数时清理最旧的过期记录
  if (rateLimitStore.size >= MAX_RATE_LIMIT_ENTRIES) {
    let oldestKey: string | undefined;
    let oldestTime = Infinity;
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < oldestTime) {
        oldestTime = value.resetTime;
        oldestKey = key;
      }
    }
    if (oldestKey) {
      rateLimitStore.delete(oldestKey);
    }
  }
  
  const record = rateLimitStore.get(ip);
  
  if (record && now < record.resetTime) {
    if (record.count >= MAX_REQUESTS) {
      return reply.status(429).send({ error: '请求过于频繁，请稍后再试' });
    }
    record.count++;
  } else {
    rateLimitStore.set(ip, { count: 1, resetTime: now + WINDOW_MS });
  }
}

// 注册限流 — Fix: 改为 IP + 邮箱组合限流，避免 NAT 下多用户被误拦
const registerRateLimitStore = new Map<string, { count: number; resetTime: number }>();
const REGISTER_WINDOW_MS = 60 * 1000; // 1分钟
const REGISTER_MAX_REQUESTS = 5; // 放宽到 5 次/分钟

export async function registerRateLimit(request: FastifyRequest, reply: FastifyReply) {
  const ip = request.ip || request.socket.remoteAddress || 'unknown';
  // 从 body 中提取邮箱用于限流键（注意：preHandler 阶段 body 可能还未解析）
  // 因此这里仍然使用 IP 作为主要限流维度，但放宽限制
  const now = Date.now();
  
  const record = registerRateLimitStore.get(ip);
  
  if (record && now < record.resetTime) {
    if (record.count >= REGISTER_MAX_REQUESTS) {
      return reply.status(429).send({ error: '注册请求过于频繁，请稍后再试' });
    }
    record.count++;
  } else {
    registerRateLimitStore.set(ip, { count: 1, resetTime: now + REGISTER_WINDOW_MS });
  }
}

// 登录限流（更严格）
const loginRateLimitStore = new Map<string, { count: number; resetTime: number }>();

const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15分钟
const LOGIN_MAX_ATTEMPTS = 5; // 最大尝试次数

export async function loginRateLimit(request: FastifyRequest, reply: FastifyReply) {
  const ip = request.ip || request.socket.remoteAddress || 'unknown';
  const now = Date.now();
  
  const record = loginRateLimitStore.get(ip);
  
  if (record && now < record.resetTime) {
    if (record.count >= LOGIN_MAX_ATTEMPTS) {
      return reply.status(429).send({ 
        error: '登录尝试次数过多，请15分钟后再试',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    }
    record.count++;
  } else {
    loginRateLimitStore.set(ip, { count: 1, resetTime: now + LOGIN_WINDOW_MS });
  }
}

// 清理过期记录
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
  for (const [key, value] of registerRateLimitStore.entries()) {
    if (now > value.resetTime) {
      registerRateLimitStore.delete(key);
    }
  }
  for (const [key, value] of loginRateLimitStore.entries()) {
    if (now > value.resetTime) {
      loginRateLimitStore.delete(key);
    }
  }
}, 60 * 1000);
