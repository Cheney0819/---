import { PUSH_CONSTANTS } from '../constants';

// ============ Server酱推送（iOS 用户）============
// 注意：只发送通用通知，不泄露任何明文内容
class ServerChanNotifier {
  private sendKey: string;

  constructor(sendKey: string) {
    this.sendKey = sendKey;
  }

  async send(title: string, content: string, url?: string): Promise<boolean> {
    for (let attempt = 0; attempt < PUSH_CONSTANTS.RETRY_ATTEMPTS; attempt++) {
      try {
        const response = await fetch(`https://sctapi.ftqq.com/${this.sendKey}.send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            desp: content + (url ? `\n\n[点击查看](${url})` : '')
          })
        });
        
        const result = await response.json() as { code: number };
        if (result.code === 0) return true;
      } catch (error) {
        console.error(`Server酱 attempt ${attempt + 1} failed:`, error);
        if (attempt < PUSH_CONSTANTS.RETRY_ATTEMPTS - 1) {
          await this.delay(PUSH_CONSTANTS.RETRY_DELAY_MS);
        }
      }
    }
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 时间胶囊送达 - 只通知"有新内容"，不泄露内容
  async notifyCapsuleDelivered(): Promise<boolean> {
    return this.send(
      '时光笺',
      '你有一条来自过去的回声 💌\n\n打开时光笺查看'
    );
  }

  // 新消息 - 只通知"有新消息"，不泄露任何内容
  async notifyNewMessage(): Promise<boolean> {
    return this.send(
      '时光笺',
      '你收到一条新消息 💬\n\n打开时光笺查看'
    );
  }

  // 日记更新
  async notifyDiaryUpdate(): Promise<boolean> {
    return this.send(
      '时光笺',
      '共享日记有新内容 📝\n\n打开时光笺查看'
    );
  }

  // 相册更新
  async notifyAlbumUpdate(): Promise<boolean> {
    return this.send(
      '时光笺',
      '共享相册有新照片 📷\n\n打开时光笺查看'
    );
  }
}

// ============ FCM 推送（Android 用户）============
// 使用 Data-only Message（静默推送），客户端本地解密后显示通知
class FCMNotifier {
  private initialized = false;

  private async init() {
    if (this.initialized) return;
    
    try {
      const admin = await import('firebase-admin');
      
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('FCM initialization failed:', error);
    }
  }

  // 发送静默推送（Data-only），不包含任何明文
  // 客户端收到后本地解密，然后显示本地通知
  async sendSilent(
    deviceToken: string,
    type: string,
    data: Record<string, string>
  ): Promise<boolean> {
    await this.init();
    
    if (!this.initialized) return false;
    
    try {
      const admin = await import('firebase-admin');
      
      await admin.messaging().send({
        token: deviceToken,
        data: {
          type,           // 通知类型：new_message | capsule_delivered | diary_update | album_update
          ...data,        // 只包含 ID，不包含内容
        },
        android: {
          priority: 'high',
        }
      });
      return true;
    } catch (error) {
      console.error('FCM send failed:', error);
      return false;
    }
  }

  // 时间胶囊送达
  async notifyCapsuleDelivered(deviceToken: string, capsuleId: string): Promise<boolean> {
    return this.sendSilent(deviceToken, 'capsule_delivered', { capsuleId });
  }

  // 新消息 - 只发送 messageId，客户端本地解密
  async notifyNewMessage(deviceToken: string, messageId: string): Promise<boolean> {
    return this.sendSilent(deviceToken, 'new_message', { messageId });
  }

  // 日记更新
  async notifyDiaryUpdate(deviceToken: string, diaryId: string): Promise<boolean> {
    return this.sendSilent(deviceToken, 'diary_update', { diaryId });
  }

  // 相册更新
  async notifyAlbumUpdate(deviceToken: string, albumId: string): Promise<boolean> {
    return this.sendSilent(deviceToken, 'album_update', { albumId });
  }
}

// ============ 统一通知服务 ============
class NotificationService {
  private serverchan: ServerChanNotifier;
  private fcm: FCMNotifier;

  constructor() {
    this.serverchan = new ServerChanNotifier(process.env.SERVERCHAN_KEY || '');
    this.fcm = new FCMNotifier();
  }

  // 新消息通知 - 不发送任何明文
  async notifyNewMessage(userId: string, messageId: string): Promise<void> {
    const { prisma } = await import('../index');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { platform: true, deviceToken: true },
    });
    
    if (!user) return;
    
    if (user.platform === 'android' && user.deviceToken) {
      // Android → FCM 静默推送，客户端本地解密
      const success = await this.fcm.notifyNewMessage(user.deviceToken, messageId);
      if (success) return;
    }
    
    // iOS 或 FCM 失败 → Server酱（通用文案）
    await this.serverchan.notifyNewMessage();
  }

  // 时间胶囊送达通知
  async notifyCapsuleDelivered(userId: string, capsuleId: string): Promise<void> {
    const { prisma } = await import('../index');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { platform: true, deviceToken: true },
    });
    
    if (!user) return;
    
    if (user.platform === 'android' && user.deviceToken) {
      const success = await this.fcm.notifyCapsuleDelivered(user.deviceToken, capsuleId);
      if (success) return;
    }
    
    await this.serverchan.notifyCapsuleDelivered();
  }

  // 日记更新通知
  async notifyDiaryUpdate(userId: string, diaryId: string): Promise<void> {
    const { prisma } = await import('../index');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { platform: true, deviceToken: true },
    });
    
    if (!user) return;
    
    if (user.platform === 'android' && user.deviceToken) {
      const success = await this.fcm.notifyDiaryUpdate(user.deviceToken, diaryId);
      if (success) return;
    }
    
    await this.serverchan.notifyDiaryUpdate();
  }

  // 相册更新通知
  async notifyAlbumUpdate(userId: string, albumId: string): Promise<void> {
    const { prisma } = await import('../index');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { platform: true, deviceToken: true },
    });
    
    if (!user) return;
    
    if (user.platform === 'android' && user.deviceToken) {
      const success = await this.fcm.notifyAlbumUpdate(user.deviceToken, albumId);
      if (success) return;
    }
    
    await this.serverchan.notifyAlbumUpdate();
  }
}

export const notificationService = new NotificationService();
