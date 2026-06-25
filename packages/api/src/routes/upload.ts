import { FastifyInstance } from 'fastify';
import Multipart from '@fastify/multipart';
import { v4 as uuidv4 } from 'uuid';
import { uploadFile } from '../services/oss';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
const ALLOWED_VOICE_TYPES = ['audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/ogg', 'audio/webm'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VOICE_SIZE = 20 * 1024 * 1024; // 20MB (60秒语音约5-10MB)
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/bmp': '.bmp',
  'audio/mp3': '.mp3',
  'audio/wav': '.wav',
  'audio/mpeg': '.mp3',
  'audio/ogg': '.ogg',
  'audio/webm': '.webm',
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
};

export async function uploadRoutes(app: FastifyInstance) {
  await app.register(Multipart);

  // 上传图片/语音/视频
  app.post('/upload', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id: userId } = request.user as { id: string };
      const fileStream = await request.file({
        limits: { fileSize: MAX_VIDEO_SIZE },
      });

      if (!fileStream) {
        return reply.status(400).send({ error: '请选择要上传的文件' });
      }

      const buffer = await fileStream.toBuffer();
      const contentType = fileStream.mimetype || '';

      // 验证文件类型
      if (!ALLOWED_IMAGE_TYPES.includes(contentType) &&
          !ALLOWED_VOICE_TYPES.includes(contentType) &&
          !ALLOWED_VIDEO_TYPES.includes(contentType)) {
        return reply.status(400).send({ error: '不支持的文件类型' });
      }

      // 验证文件大小
      const maxSize = ALLOWED_IMAGE_TYPES.includes(contentType) ? MAX_IMAGE_SIZE
        : ALLOWED_VOICE_TYPES.includes(contentType) ? MAX_VOICE_SIZE
        : MAX_VIDEO_SIZE;
      if (buffer.length > maxSize) {
        const limitMB = maxSize / 1024 / 1024;
        return reply.status(400).send({ error: `文件大小不能超过 ${limitMB}MB` });
      }

      // 生成文件名：YYYY/MM/userId_uuid.ext
      const ext = EXTENSIONS[contentType] || '.bin';
      const date = new Date();
      const yearMonth = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
      const fileName = `${userId}_${uuidv4()}${ext}`;
      const key = `uploads/${yearMonth}/${fileName}`;

      // 上传到 OSS
      const result = await uploadFile(buffer, key);

      return reply.status(201).send({
        url: result.url,
        key: result.key,
        contentType,
      });
    } catch (error) {
      app.log.error('Upload error:', error);
      return reply.status(500).send({ error: '上传失败，请稍后重试' });
    }
  });
}
