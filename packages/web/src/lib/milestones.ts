// 里程碑阈值
export const MILESTONE_THRESHOLDS = {
  MESSAGES: [10, 50, 100, 500, 1000, 5000],
  DAYS: [7, 30, 100, 365, 730, 1000],
  PHOTOS: [10, 50, 100, 500],
  CAPSULES: [1, 5, 10, 50],
};

// 里程碑模板
export const MILESTONE_TEMPLATES: Record<string, (count: number) => { title: string; content: string }> = {
  messages: (count) => ({
    title: `${count}条消息`,
    content: `我们已经聊了 ${count} 条消息 💬`,
  }),
  days: (count) => ({
    title: `${count}天纪念`,
    content: `我们已经在一起 ${count} 天了 💝`,
  }),
  photos: (count) => ({
    title: `${count}张照片`,
    content: `我们已经共享了 ${count} 张照片 📷`,
  }),
  capsules: (count) => ({
    title: `${count}个时间胶囊`,
    content: `我们已经创建了 ${count} 个时间胶囊 💌`,
  }),
};

// 检测里程碑
export function detectMilestones(stats: {
  messageCount: number;
  daysSinceStart: number;
  photoCount: number;
  capsuleCount: number;
}) {
  const milestones: Array<{
    type: string;
    count: number;
    title: string;
    content: string;
  }> = [];

  // 检测消息里程碑
  for (const threshold of MILESTONE_THRESHOLDS.MESSAGES) {
    if (stats.messageCount >= threshold) {
      const template = MILESTONE_TEMPLATES.messages(threshold);
      milestones.push({
        type: 'messages',
        count: threshold,
        ...template,
      });
    }
  }

  // 检测天数里程碑
  for (const threshold of MILESTONE_THRESHOLDS.DAYS) {
    if (stats.daysSinceStart >= threshold) {
      const template = MILESTONE_TEMPLATES.days(threshold);
      milestones.push({
        type: 'days',
        count: threshold,
        ...template,
      });
    }
  }

  // 检测照片里程碑
  for (const threshold of MILESTONE_THRESHOLDS.PHOTOS) {
    if (stats.photoCount >= threshold) {
      const template = MILESTONE_TEMPLATES.photos(threshold);
      milestones.push({
        type: 'photos',
        count: threshold,
        ...template,
      });
    }
  }

  // 检测时间胶囊里程碑
  for (const threshold of MILESTONE_THRESHOLDS.CAPSULES) {
    if (stats.capsuleCount >= threshold) {
      const template = MILESTONE_TEMPLATES.capsules(threshold);
      milestones.push({
        type: 'capsules',
        count: threshold,
        ...template,
      });
    }
  }

  return milestones;
}

// 检查是否达到新里程碑
export function checkNewMilestone(
  prevStats: { messageCount: number },
  currentStats: { messageCount: number }
): { isNew: boolean; milestone?: { title: string; content: string } } {
  for (const threshold of MILESTONE_THRESHOLDS.MESSAGES) {
    if (prevStats.messageCount < threshold && currentStats.messageCount >= threshold) {
      const template = MILESTONE_TEMPLATES.messages(threshold);
      return { isNew: true, milestone: template };
    }
  }
  return { isNew: false };
}
