import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const notificationId = parseInt(params.id);
    if (isNaN(notificationId)) {
      return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 });
    }

    // Проверяем, что уведомление принадлежит пользователю и не отправлено
    const notification = await prisma.scheduledNotification.findFirst({
      where: {
        id: notificationId,
        userId: user.id,
        isSent: false
      }
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found or already sent' }, { status: 404 });
    }

    // Удаляем уведомление
    await prisma.scheduledNotification.delete({
      where: { id: notificationId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scheduled notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
