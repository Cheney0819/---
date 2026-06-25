const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface RequestOptions {
  method?: string;
  body?: any;
  token?: string;
}

export async function api<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Support both direct token string and extracted from stored auth object
  const authToken = typeof token === 'string' ? token : (token as any)?.token;
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  console.log(`[API] ${method} ${API_BASE}${path}`);
  
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  console.log(`[API] Response: ${response.status}`);
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  
  return data;
}

// Auth API
export const authApi = {
  register: (data: { username: string; email: string; password: string; displayName?: string }) =>
    api('/api/auth/register', { method: 'POST', body: { ...data, platform: 'web' } }),
  
  login: (data: { email: string; password: string }) =>
    api('/api/auth/login', { method: 'POST', body: data }),
  
  getMe: (token: string) =>
    api('/api/auth/me', { token }),
};

// User API
export const userApi = {
  update: (data: { displayName?: string; avatarUrl?: string }, token: string) =>
    api('/api/users/me', { method: 'PUT', body: data, token }),
  
  search: (q: string, token: string) =>
    api(`/api/users/search?q=${encodeURIComponent(q)}`, { token }),
};

// Pair API
export const pairApi = {
  create: (partnerId: string, token: string) =>
    api('/api/pairs', { method: 'POST', body: { partnerId }, token }),
  
  list: (token: string) =>
    api('/api/pairs', { token }),
};

// Message API
export const messageApi = {
  list: (pairId: string, token: string, page = 1) =>
    api(`/api/messages/${pairId}?page=${page}`, { token }),
  
  send: (pairId: string, content: string, token: string, contentType = 'text', mediaUrls: string[] = []) =>
    api(`/api/messages/${pairId}`, { method: 'POST', body: { content, contentType, mediaUrls }, token }),
};

// Capsule API
export const capsuleApi = {
  create: (data: { pairId: string; receiverId: string; content: string; triggerTime: string }, token: string) =>
    api('/api/capsules', { method: 'POST', body: data, token }),
  
  sent: (token: string) =>
    api('/api/capsules/sent', { token }),
  
  received: (token: string) =>
    api('/api/capsules/received', { token }),
  
  open: (id: string, token: string) =>
    api(`/api/capsules/${id}/open`, { method: 'POST', body: {}, token }),
};

// Diary API
export const diaryApi = {
  list: (token: string) =>
    api('/api/diaries', { token }),
  
  create: (title: string, token: string) =>
    api('/api/diaries', { method: 'POST', body: { title }, token }),
  
  get: (id: string, token: string) =>
    api(`/api/diaries/${id}`, { token }),
  
  addEntry: (diaryId: string, content: string, mood?: string, token?: string) =>
    api(`/api/diaries/${diaryId}/entries`, { 
      method: 'POST', 
      body: { content, mood }, 
      token 
    }),
  
  deleteEntry: (entryId: string, token: string) =>
    api(`/api/diaries/entries/${entryId}`, { method: 'DELETE', token }),
};

// Keys API
export const keysApi = {
  uploadPublicKey: (publicKey: string, token: string) =>
    api('/api/users/me/keys', { method: 'PUT', body: { publicKey }, token }),
  
  getPublicKey: (userId: string, token: string) =>
    api(`/api/users/${userId}/publickey`, { token }),
};

// Album API
export const albumApi = {
  list: (token: string) =>
    api('/api/albums', { token }),
  
  create: (name: string, token: string, description?: string) =>
    api('/api/albums', { method: 'POST', body: { name, description }, token }),
  
  get: (id: string, token: string) =>
    api(`/api/albums/${id}`, { token }),
  
  addPhoto: (albumId: string, url: string, token: string) =>
    api(`/api/albums/${albumId}/photos`, { method: 'POST', body: { url, mediaType: 'image' }, token }),
  
  deletePhoto: (photoId: string, token: string) =>
    api(`/api/albums/photos/${photoId}`, { method: 'DELETE', token }),
};

// Invite Code API
export const inviteApi = {
  findByCode: (code: string, token: string) =>
    api(`/api/users/by-code/${code}`, { token }),
};

// ============ 文件上传 API ============
export const uploadApi = {
  // 上传文件（图片/语音/视频）
  // 流程：1. 向后端请求预签名URL  2. 前端直传OSS  3. 返回公开URL
  file: async (file: File, token: string): Promise<{ url: string; key: string; contentType: string }> => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
    
    // Step 1: 获取预签名上传凭证
    const formData = new FormData();
    formData.append('file', file);
    
    const signResponse = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    
    if (!signResponse.ok) {
      const err = await signResponse.json();
      throw new Error(err.error || '获取上传凭证失败');
    }
    
    const { uploadUrl, key, authorization, dateHeader } = await signResponse.json();
    
    // Step 2: 直传 OSS
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': authorization,
        'Date': dateHeader,
        'Content-Type': file.type,
      },
      body: file,
    });
    
    if (!uploadRes.ok) {
      throw new Error('文件上传到 OSS 失败');
    }
    
    return { url: uploadUrl, key, contentType: file.type };
  },
  
  files: async (files: File[], token: string): Promise<Array<{ url: string; key: string; contentType: string }>> => {
    const results = await Promise.all(files.map(f => uploadApi.file(f, token)));
    return results;
  },
};
