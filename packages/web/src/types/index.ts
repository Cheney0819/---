export interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  platform: string;
  inviteCode?: string;
}

export interface Pair {
  id: string;
  userA: User;
  userB: User;
  status: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  readAt?: string;
}

export interface TimeCapsule {
  id: string;
  content: string;
  status: 'pending' | 'delivered' | 'read';
  triggerTime: string;
  createdAt: string;
}

export interface SharedDiary {
  id: string;
  title: string;
  entries: DiaryEntry[];
}

export interface DiaryEntry {
  id: string;
  content: string;
  mood?: string;
  author: { id: string; username: string; displayName?: string };
  createdAt: string;
}

export interface SharedAlbum {
  id: string;
  name: string;
  media: SharedMedia[];
}

export interface SharedMedia {
  id: string;
  url: string;
  mediaType: string;
  uploader: { username: string; displayName?: string };
  createdAt: string;
}
