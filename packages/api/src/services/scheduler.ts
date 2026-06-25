import { prisma } from '../index';
import { notificationService } from './notification';

// 检查并触发到期的时间胶囊
export async function checkAndTriggerCapsules() {
  try {
    const pendingCapsules = await prisma.timeCapsule.findMany({
      where: {
        status: 'pending',
        triggerTime: { lte: new Date() },
      },
      include: {
        sender: { select: { id: true, username: true, displayName: true } },
        receiver: { select: { id: true, username: true, platform: true, deviceToken: true } },
      },
    });

    console.log(`[Scheduler] Found ${pendingCapsules.length} capsules to trigger`);

    for (const capsule of pendingCapsules) {
      try {
        await prisma.timeCapsule.update({
          where: { id: capsule.id },
          data: { status: 'delivered', deliveredAt: new Date() },
        });

        await notificationService.notifyCapsuleDelivered(capsule.receiverId, capsule.id);
        console.log(`[Scheduler] Capsule ${capsule.id} triggered`);
      } catch (error) {
        // Fix 10: 只记录 error.message
        console.error(`[Scheduler] Error triggering capsule ${capsule.id}:`, error instanceof Error ? error.message : String(error));
      }
    }
  } catch (error) {
    // Fix 10: 只记录 error.message
    console.error('[Scheduler] Error checking capsules:', error instanceof Error ? error.message : String(error));
  }
}

// 启动定时任务
export function startScheduler() {
  setInterval(checkAndTriggerCapsules, 60 * 1000);
  checkAndTriggerCapsules();
  console.log('[Scheduler] Started');
}
