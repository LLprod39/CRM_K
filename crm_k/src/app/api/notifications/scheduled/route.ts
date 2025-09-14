import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    // Получаем запланированные уведомления для текущего пользователя
    const notifications = await prisma.scheduledNotification.findMany({
      where: { 
        userId: user.id 
      },
      include: {
        lesson: {
          include: {
            student: {
              select: {
                fullName: true
              }
            }
          }
        }
      },
      orderBy: {
        scheduledTime: 'asc'
      }
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching scheduled notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
