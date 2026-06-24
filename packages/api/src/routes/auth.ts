import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../index';
import { loginRateLimit } from '../middleware/ratelimit';
import { USER_CONSTANTS, SECURITY_CONSTANTS } from '../constants';

// ============ 验证 Schema ============
const registerSchema = z.object({
  username: z.string()
    .min(USER_CONSTANTS.USERNAME_MIN_LENGTH)
    .max(USER_CONSTANTS.USERNAME_MAX_LENGTH),
  email: z.string().email(),
  password: z.string()
    .min(USER_CONSTANTS.PASSWORD_MIN_LENGTH)
    .max(USER_CONSTANTS.PASSWORD_MAX_LENGTH),
  displayName: z.string().max(USER_CONSTANTS.DISPLAY_NAME_MAX_LENGTH).optional(),
  platform: z.enum(['android', 'ios', 'web']).default('web'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// ============ 路由 ============
export async function authRoutes(app: FastifyInstance) {
  // 注册
  app.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);
    
    // 检查用户名是否已存在
    const existingUsername = await prisma.user.findUnique({
      where: { username: body.username },
    });
    if (existingUsername) {
      return reply.status(400).send({ error: '用户名已被占用' });
    }
    
    // 检查邮箱是否已存在
    const existingEmail = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existingEmail) {
      return reply.status(400).send({ error: '邮箱已被注册' });
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(
      body.password,
      USER_CONSTANTS.BCRYPT_SALT_ROUNDS
    );
    
    // 生成唯一识别码 (8位)
    const generateCode = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    let inviteCode = generateCode();
    
    // 确保识别码唯一
    while (await prisma.user.findUnique({ where: { inviteCode } })) {
      inviteCode = generateCode();
    }

    // 创建用户
    const user = await prisma.user.create({
      data: {
        username: body.username,
        email: body.email,
        password: hashedPassword,
        displayName: body.displayName,
        platform: body.platform,
        inviteCode,
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        platform: true,
        inviteCode: true,
        createdAt: true,
      },
    });
    
    // 生成 JWT
    const token = app.jwt.sign(
      { id: user.id, username: user.username },
      { expiresIn: `${SECURITY_CONSTANTS.JWT_EXPIRY_HOURS}h` }
    );
    
    return { user, token };
  });
  
  // 登录
  app.post('/login', { preHandler: [loginRateLimit] }, async (request, reply) => {
    const body = loginSchema.parse(request.body);
    
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (!user) {
      return reply.status(401).send({ error: '邮箱或密码错误' });
    }
    
    // 验证密码
    const isValid = await bcrypt.compare(body.password, user.password);
    if (!isValid) {
      return reply.status(401).send({ error: '邮箱或密码错误' });
    }
    
    // 生成 JWT
    const token = app.jwt.sign(
      { id: user.id, username: user.username },
      { expiresIn: `${SECURITY_CONSTANTS.JWT_EXPIRY_HOURS}h` }
    );
    
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        platform: user.platform,
        inviteCode: user.inviteCode,
      },
      token,
    };
  });
  
  // 获取当前用户
  app.get('/me', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.user as { id: string };
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        platform: true,
        inviteCode: true,
        createdAt: true,
      },
    });
    
    return { user };
  });
}
