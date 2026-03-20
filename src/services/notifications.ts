import prisma from '../db/prisma.js';

export async function createNotification(title: string, message: string, type: string, severity: string) {
  try {
    await (prisma as any).notification.create({
      data: {
        title,
        message,
        type,
        severity,
        is_read: false
      }
    });
    console.log(`[Notification] Created: ${title}`);
  } catch (error) {
    console.error('[Notification] Error creating notification:', error);
  }
}
