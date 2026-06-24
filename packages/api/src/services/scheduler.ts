import { prisma } from '../index';
import { notificationService } from './notification';

// 检查并触发到期的时间胶囊
export async function checkAndTriggerCapsules() {
  try {
    // 查找所有 pending 状态且已到期的胶囊
    const pendingCapsules = await prisma.timeCapsule.findMany({
      where: {
        status: 'pending',
        triggerTime: {
          lte: new Date(),
        },
      },
      include: {
        sender: {
          select: { id: true, username: true, displayName: true },
        },
        receiver: {
          select: { id: true, username: true, platform: true, deviceToken: true },
        },
      },
    });

    console.log(`[Scheduler] Found ${pendingCapsules.length} capsules to trigger`);

    for (const capsule of pendingCapsules) {
      try {
        // 更新状态为 delivered
        await prisma.timeCapsule.update({
          where: { id: capsule.id },
          data: {
            status: 'delivered',
            deliveredAt: new Date(),
          },
        });

        // 发送通知
        const senderName = capsule.sender.displayName || capsule.sender.username;
        await notificationService.notifyCapsuleDelivered(
          capsule.receiverId,
          senderName,
          capsule.id
        );

        console.log(`[Scheduler] Capsule ${capsule.id} triggered and notification sent`);
      } catch (error) {
        console.error(`[Scheduler] Error triggering capsule ${capsule.id}:`, error);
      }
    }
  } catch (error) {
    console.error('[Scheduler] Error checking capsules:', error);
  }
}

// 启动定时任务
export function startScheduler() {
  // 每分钟检查一次
  setInterval(checkAndTriggerCapsules, 60 * 1000);
  
  // 启动时立即检查一次
  checkAndTriggerCapsules();
  
  console.log('[Scheduler] Started - checking capsules every minute');
}
