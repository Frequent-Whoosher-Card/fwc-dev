import { PrismaClient } from '../../generated/client';

const prisma = new PrismaClient();

export async function logActivity({ userId, action, description, createdBy }: {
  userId: string;
  action: string;
  description?: string;
  createdBy?: string;
}) {
  return prisma.activityLog.create({
    data: {
      userId,
      action,
      description,
      createdBy,
    },
  });
}

export async function getActivityLogs({ userId }: { userId?: string }) {
  return prisma.activityLog.findMany({
    where: userId ? { userId } : undefined,
    orderBy: { createdAt: 'desc' },
  });
}
