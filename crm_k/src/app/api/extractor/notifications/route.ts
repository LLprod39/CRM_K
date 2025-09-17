import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ConversationDraftRepository } from '@/infrastructure/repositories/ConversationDraftRepository';
import { ExtractorConfigRepository } from '@/infrastructure/repositories/ExtractorConfigRepository';
import { ExtractorService } from '@/domain/services/ExtractorService';
import { broadcastWhatsAppUpdate } from '@/lib/whatsappEvents';
import { getAuthUser } from '@/lib/auth';

const conversationDraftRepository = new ConversationDraftRepository(prisma);
const extractorConfigRepository = new ExtractorConfigRepository(prisma);
const extractorService = new ExtractorService(conversationDraftRepository, extractorConfigRepository);

/**
 * API для уведомлений оператора о результатах экстракции
 * GET - получить список уведомлений
 * POST - создать уведомление
 * PUT - обновить статус уведомления
 */

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Получаем уведомления экстрактора
    const notifications = await prisma.extractorNotification.findMany({
      where: {
        status: status as 'pending' | 'acknowledged' | 'resolved',
      },
      include: {
        conversationDraft: {
          include: {
            conversationMessages: {
              orderBy: { createdAt: 'desc' },
              take: 5
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    return NextResponse.json({
      success: true,
      notifications: notifications.map(notification => ({
        id: notification.id,
        type: notification.type,
        status: notification.status,
        message: notification.message,
        confidence: notification.confidence,
        conversationId: notification.conversationId,
        createdAt: notification.createdAt,
        acknowledgedAt: notification.acknowledgedAt,
        resolvedAt: notification.resolvedAt,
        draft: notification.conversationDraft ? {
          id: notification.conversationDraft.id,
          formType: notification.conversationDraft.formType,
          isComplete: notification.conversationDraft.isComplete,
          draftData: notification.conversationDraft.draftData,
          recentMessages: notification.conversationDraft.conversationMessages.map(msg => ({
            id: msg.id,
            content: msg.content,
            senderType: msg.senderType,
            createdAt: msg.createdAt
          }))
        } : null
      })),
      pagination: {
        limit,
        offset,
        hasMore: notifications.length === limit
      }
    });
  } catch (error) {
    console.error('Error getting extractor notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      type, 
      message, 
      confidence, 
      conversationId, 
      draftId,
      priority = 'normal'
    } = body;

    if (!type || !message || !conversationId) {
      return NextResponse.json({ 
        error: 'Missing required fields: type, message, conversationId' 
      }, { status: 400 });
    }

    // Создаем уведомление
    const notification = await prisma.extractorNotification.create({
      data: {
        type,
        message,
        confidence: confidence || 0,
        conversationId,
        draftId,
        priority,
        status: 'pending',
        createdBy: authUser.id
      },
      include: {
        conversationDraft: true
      }
    });

    // Отправляем real-time уведомление
    broadcastWhatsAppUpdate({
      type: 'extractor_notification',
      notification: {
        id: notification.id,
        type: notification.type,
        message: notification.message,
        confidence: notification.confidence,
        conversationId: notification.conversationId,
        createdAt: notification.createdAt
      }
    });

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        type: notification.type,
        message: notification.message,
        confidence: notification.confidence,
        conversationId: notification.conversationId,
        createdAt: notification.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating extractor notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, status, action } = body;

    if (!notificationId || !status) {
      return NextResponse.json({ 
        error: 'Missing required fields: notificationId, status' 
      }, { status: 400 });
    }

    const updateData: any = {
      status,
      updatedBy: authUser.id
    };

    if (status === 'acknowledged') {
      updateData.acknowledgedAt = new Date();
      updateData.acknowledgedBy = authUser.id;
    } else if (status === 'resolved') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = authUser.id;
    }

    const notification = await prisma.extractorNotification.update({
      where: { id: notificationId },
      data: updateData,
      include: {
        conversationDraft: true
      }
    });

    // Если это действие по черновику (например, подтверждение данных)
    if (action === 'commit_draft' && notification.conversationDraft) {
      try {
        const result = await extractorService.commitDraft(
          notification.conversationDraft.id,
          authUser.id
        );

        // Отправляем уведомление об успешном коммите
        broadcastWhatsAppUpdate({
          type: 'draft_committed',
          conversationId: notification.conversationId,
          draftId: notification.conversationDraft.id,
          result: {
            success: result.success,
            message: result.message,
            createdEntities: result.createdEntities
          }
        });
      } catch (error) {
        console.error('Error committing draft:', error);
        // Не прерываем выполнение, просто логируем ошибку
      }
    }

    // Отправляем обновление статуса
    broadcastWhatsAppUpdate({
      type: 'notification_status_updated',
      notificationId: notification.id,
      status: notification.status,
      updatedBy: authUser.id
    });

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        status: notification.status,
        acknowledgedAt: notification.acknowledgedAt,
        resolvedAt: notification.resolvedAt
      }
    });
  } catch (error) {
    console.error('Error updating extractor notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
