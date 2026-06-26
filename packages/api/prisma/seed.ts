import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始填充测试数据...');

  // 创建两个测试用户
  const user1 = await prisma.user.upsert({
    where: { username: 'alice' },
    update: {},
    create: {
      username: 'alice',
      displayName: 'Alice',
      email: 'alice@shiguangjian.app',
      password: '$2a$12$9Jk3tGkPSURmv9a1Vw8CnOmMcuK4LDxpger0ABb/eP72ahuDyeoj.', // bcrypt hash
      inviteCode: 'A001',
      platform: 'web',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { username: 'bob' },
    update: {},
    create: {
      username: 'bob',
      displayName: 'Bob',
      email: 'bob@shiguangjian.app',
      password: '$2a$12$9Jk3tGkPSURmv9a1Vw8CnOmMcuK4LDxpger0ABb/eP72ahuDyeoj.', // bcrypt hash
      inviteCode: 'B001',
      platform: 'web',
    },
  });

  console.log(`  用户: ${user1.username}, ${user2.username}`);

  // 创建配对
  const [userAId, userBId] = user1.id < user2.id
    ? [user1.id, user2.id]
    : [user2.id, user1.id];

  const pair = await prisma.pair.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    update: {},
    create: {
      userAId,
      userBId,
      status: 'active',
    },
  });

  console.log(`  配对: ${pair.id}`);

  console.log('✅ 种子数据填充完成');
}

main()
  .catch((e) => {
    console.error('❌ 种子数据填充失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
