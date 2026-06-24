// ============ 用户 ============
export interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  platform: 'android' | 'ios' | 'web';
  createdAt: Date;
}

// ============ 配对 ============
export interface Pair {
  id: string;
  status: 'active' | 'inactive';
  userA: User;
  userB: User;
  createdAt: Date;
}

// ============ 消息 ============
export interface Message {
  id: string;
  content: string;
  contentType: 'text' | 'image' | 'voice';
  mediaUrls: string[];
  sender: Pick<User, 'id' | 'username' | 'displayName'>;
  createdAt: Date;
  readAt?: Date;
}

// ============ 时间胶囊 ============
export interface TimeCapsule {
  id: string;
  content: string;
  mediaUrls: string[];
  triggerTime: Date;
  triggerCondition?: any;
  status: 'pending' | 'delivered' | 'read';
  sender: Pick<User, 'id' | 'username' | 'displayName'>;
  receiver: Pick<User, 'id' | 'username' | 'displayName'>;
  createdAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
}

// ============ 共享日记 ============
export interface SharedDiary {
  id: string;
  title: string;
  entries: DiaryEntry[];
  createdAt: Date;
}

export interface DiaryEntry {
  id: string;
  content: string;
  mood?: string;
  weather?: string;
  tags: string[];
  author: Pick<User, 'id' | 'username' | 'displayName'>;
  createdAt: Date;
}

// ============ 共享相册 ============
export interface SharedAlbum {
  id: string;
  name: string;
  description?: string;
  media: SharedMedia[];
  createdAt: Date;
}

export interface SharedMedia {
  id: string;
  url: string;
  thumbnailUrl?: string;
  mediaType: 'image' | 'video';
  metadata?: any;
  uploader: Pick<User, 'id' | 'username' | 'displayName'>;
  createdAt: Date;
}

// ============ API 响应 ============
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
