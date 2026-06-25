import OSS from 'ali-oss';

const OSS_ENDPOINT = process.env.OSS_ENDPOINT || 'oss-cn-chengdu.aliyuncs.com';
const OSS_ACCESS_KEY_ID = process.env.OSS_ACCESS_KEY_ID;
const OSS_ACCESS_KEY_SECRET = process.env.OSS_ACCESS_KEY_SECRET;
const OSS_BUCKET = process.env.OSS_BUCKET || 'web-80-1';

if (!OSS_ACCESS_KEY_ID || !OSS_ACCESS_KEY_SECRET) {
  console.warn('⚠️  OSS 环境变量未配置，文件上传功能不可用');
}

export const ossClient = OSS_ACCESS_KEY_ID && OSS_ACCESS_KEY_SECRET
  ? new OSS({
      region: OSS_ENDPOINT.includes('.') ? undefined : OSS_ENDPOINT,
      endpoint: OSS_ENDPOINT.includes('.') ? `https://${OSS_ENDPOINT}` : undefined,
      accessKeyId: OSS_ACCESS_KEY_ID,
      accessKeySecret: OSS_ACCESS_KEY_SECRET,
      bucket: OSS_BUCKET,
      secure: true,
    })
  : null;

export interface OssUploadResult {
  url: string;
  key: string;
}

export async function uploadFile(file: Buffer, key: string): Promise<OssUploadResult> {
  if (!ossClient) {
    throw new Error('OSS 未配置，请联系管理员');
  }

  const result = await ossClient.put(key, file);
  return {
    url: result.url,
    key: result.name,
  };
}

export async function deleteFile(key: string): Promise<void> {
  if (!ossClient) {
    throw new Error('OSS 未配置，请联系管理员');
  }
  await ossClient.delete(key);
}
