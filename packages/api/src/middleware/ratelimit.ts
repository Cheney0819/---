import { FastifyRequest, FastifyReply } from 'fastify';

// 简单的内存限流器
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 60 * 1000; // 1分钟
const MAX_REQUESTS = 60; // 最大请求数

export async function rateLimit(request: FastifyRequest, reply: FastifyReply) {
  const ip = request.ip || request.socket.remoteAddress || 'unknown';
  const now = Date.now();
  
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
  for (const [key, value] of loginRateLimitStore.entries()) {
    if (now > value.resetTime) {
      loginRateLimitStore.delete(key);
    }
  }
}, 60 * 1000);
