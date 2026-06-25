import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, AuthError } from '@/lib/auth';
import crypto from 'crypto';

const OSS_ENDPOINT = process.env.OSS_ENDPOINT || 'oss-cn-chengdu.aliyuncs.com';
const OSS_ACCESS_KEY_ID = process.env.OSS_ACCESS_KEY_ID || '';
const OSS_ACCESS_KEY_SECRET = process.env.OSS_ACCESS_KEY_SECRET || '';
const OSS_BUCKET = process.env.OSS_BUCKET || 'web-80-1';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
const ALLOWED_VOICE_TYPES = ['audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/ogg', 'audio/webm'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VOICE_SIZE = 20 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif',
  'image/webp': '.webp', 'image/bmp': '.bmp',
  'audio/mp3': '.mp3', 'audio/wav': '.wav', 'audio/mpeg': '.mp3',
  'audio/ogg': '.ogg', 'audio/webm': '.webm',
  'video/mp4': '.mp4', 'video/quicktime': '.mov',
};

export async function POST(request: NextRequest) {
  try {
    if (!OSS_ACCESS_KEY_ID || !OSS_ACCESS_KEY_SECRET) {
      return NextResponse.json({ error: '文件上传服务未配置' }, { status: 503 });
    }

    const auth = await getAuthUser(request);
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '请选择要上传的文件' }, { status: 400 });
    }

    const contentType_file = file.type || '';
    if (!ALLOWED_IMAGE_TYPES.includes(contentType_file) &&
        !ALLOWED_VOICE_TYPES.includes(contentType_file) &&
        !ALLOWED_VIDEO_TYPES.includes(contentType_file)) {
      return NextResponse.json({ error: '不支持的文件类型' }, { status: 400 });
    }

    const maxSize = ALLOWED_IMAGE_TYPES.includes(contentType_file) ? MAX_IMAGE_SIZE
      : ALLOWED_VOICE_TYPES.includes(contentType_file) ? MAX_VOICE_SIZE
      : MAX_VIDEO_SIZE;
    if (file.size > maxSize) {
      const limitMB = maxSize / 1024 / 1024;
      return NextResponse.json({ error: `文件大小不能超过 ${limitMB}MB` }, { status: 400 });
    }

    const ext = EXTENSIONS[contentType_file] || '.bin';
    const date = new Date();
    const yearMonth = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
    const fileName = `${auth.id}_${Date.now()}${ext}`;
    const key = `uploads/${yearMonth}/${fileName}`;

    // 生成 PUT 预签名 URL
    const dateHeader = new Date().toUTCString();
    const canonicalResource = `/${OSS_BUCKET}/${key}`;
    const stringToSign = `PUT\n\n${contentType_file}\n${dateHeader}\n${canonicalResource}`;
    const signature = crypto
      .createHmac('sha1', OSS_ACCESS_KEY_SECRET)
      .update(stringToSign)
      .digest('base64');

    const presignedUrl = `https://${OSS_BUCKET}.${OSS_ENDPOINT}/${key}`;

    return NextResponse.json({
      uploadUrl: presignedUrl,
      key,
      contentType: contentType_file,
      dateHeader,
      authorization: `OSS ${OSS_ACCESS_KEY_ID}:${signature}`,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Upload sign error:', error);
    return NextResponse.json({ error: '生成上传凭证失败' }, { status: 500 });
  }
}
