import { SignJWT, jwtVerify } from 'jose';
import { SECURITY_CONSTANTS } from './constants';

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET 环境变量未设置');
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: { id: string; username: string }): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${SECURITY_CONSTANTS.JWT_EXPIRY_HOURS}h`)
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setSubject(payload.id)
    .setIssuer('shiguangjian')
    .setAudience('shiguangjian-web')
    .sign(getJwtSecret());
}

export async function verifyToken(token: string): Promise<{ id: string; username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      issuer: 'shiguangjian',
      audience: 'shiguangjian-web',
    });
    const sub = payload.sub as string | undefined;
    const id = payload.id as string | undefined;
    if (!sub || !id || sub !== id) {
      return null;
    }
    return { id, username: payload.username as string };
  } catch {
    return null;
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function getAuthUser(request: Request): Promise<{ id: string; username: string }> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError('未登录或登录已过期');
  }
  const token = authHeader.slice(7);
  const user = await verifyToken(token);
  if (!user) {
    throw new AuthError('未登录或登录已过期');
  }
  return user;
}
