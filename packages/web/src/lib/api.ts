const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  console.log(`[API] ${method} ${API_BASE}${path}`);
  
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  console.log(`[API] Response: ${response.status}`);
  
  const data = await response.json();
  console.log(`[API] Data:`, data);
  
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
  
  send: (pairId: string, content: string, token: string) =>
    api(`/api/messages/${pairId}`, { method: 'POST', body: { content, contentType: 'text' }, token }),
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
