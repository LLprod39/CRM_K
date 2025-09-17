import { NextRequest, NextResponse } from 'next/server';
import { Client, LocalAuth, type Message } from 'whatsapp-web.js';
import QRCode from 'qrcode';
import { prisma } from '@/lib/db';
import { ConversationDraftRepository } from '@/infrastructure/repositories/ConversationDraftRepository';
import { ExtractorConfigRepository } from '@/infrastructure/repositories/ExtractorConfigRepository';
import { ExtractorService } from '@/domain/services/ExtractorService';
import type { FormType } from '@/domain/entities';
import { broadcastWhatsAppUpdate } from '@/lib/whatsappEvents';

let whatsappClient: Client | null = null;
let qrCodeData: string | null = null;
let isClientReady = false;

const conversationDraftRepository = new ConversationDraftRepository(prisma);
const extractorConfigRepository = new ExtractorConfigRepository(prisma);
const extractorService = new ExtractorService(conversationDraftRepository, extractorConfigRepository);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const chatId = searchParams.get('chatId');

  try {
    switch (action) {
      case 'init':
        return await initializeWhatsApp();
      case 'status':
        return NextResponse.json({ 
          ready: isClientReady,
          qrCode: qrCodeData 
        });
      case 'qr':
        return NextResponse.json({ qrCode: qrCodeData });
      case 'chats':
        return await getChats();
      case 'contacts':
        return await getContacts();
      case 'messages':
        if (!chatId) {
          return NextResponse.json({ error: 'chatId is required' }, { status: 400 });
        }
        const limit = parseInt(searchParams.get('limit') || '50');
        return await getChatMessages(chatId, limit);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('WhatsApp API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { action, phoneNumber, message } = await request.json();

  try {
    if (!whatsappClient || !isClientReady) {
      return NextResponse.json({ error: 'WhatsApp client not ready' }, { status: 400 });
    }

    switch (action) {
      case 'send':
        if (!phoneNumber || !message) {
          return NextResponse.json({ error: 'Phone number and message are required' }, { status: 400 });
        }
        
        console.log(`Sending message to: ${phoneNumber}`);
        console.log(`Message: ${message}`);
        
        // Правильно форматируем номер для отправки
        let formattedChatId = phoneNumber;
        if (!phoneNumber.includes('@')) {
          // Убираем символы и оставляем только цифры
          const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
          formattedChatId = `${cleanNumber}@c.us`;
        }
        
        console.log(`Formatted chat ID: ${formattedChatId}`);
        
        const sentMessage = await whatsappClient.sendMessage(formattedChatId, message);
        console.log('Message sent successfully:', sentMessage.id._serialized);
        
        return NextResponse.json({ 
          success: true, 
          message: 'Message sent successfully',
          messageId: sentMessage.id._serialized 
        });
      
      case 'disconnect':
        await whatsappClient.destroy();
        whatsappClient = null;
        isClientReady = false;
        qrCodeData = null;
        
        return NextResponse.json({ success: true, message: 'Disconnected successfully' });
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('WhatsApp POST error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

async function initializeWhatsApp() {
  if (whatsappClient) {
    return NextResponse.json({ 
      ready: isClientReady,
      qrCode: qrCodeData 
    });
  }

  whatsappClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  whatsappClient.on('qr', async (qr) => {
    try {
      qrCodeData = await QRCode.toDataURL(qr);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  });

  whatsappClient.on('ready', () => {
    console.log('WhatsApp client is ready!');
    isClientReady = true;
  });

    whatsappClient.on('message', (message) => {
    const conversationId = getConversationId(message)
    if (conversationId) {
      broadcastWhatsAppUpdate({
        type: 'new_message',
        chatId: conversationId,
        messageId: message.id._serialized,
        fromMe: message.fromMe,
      })
    }

    processIncomingMessage(message).catch((error) => {
      console.error('Failed to process incoming WhatsApp message:', error)
    })
  });

  whatsappClient.on('disconnected', () => {
    console.log('WhatsApp client disconnected');
    isClientReady = false;
    qrCodeData = null;
  });

  whatsappClient.on('auth_failure', (msg) => {
    console.error('Authentication failed:', msg);
    isClientReady = false;
  });

  await whatsappClient.initialize();

  return NextResponse.json({ 
    success: true, 
    message: 'WhatsApp client initialized',
    ready: isClientReady,
    qrCode: qrCodeData 
  });
}

async function getChats() {
  if (!whatsappClient || !isClientReady) {
    return NextResponse.json({ error: 'WhatsApp client not ready' }, { status: 400 });
  }

  try {
    console.log('Loading chats from WhatsApp...');
    const chats = await whatsappClient.getChats();
    console.log(`Found ${chats.length} chats`);
    
    // Фильтруем только активные чаты (с сообщениями)
    const activeChats = chats.filter(chat => {
      return chat.lastMessage && 
             !chat.isReadOnly && 
             !chat.archived;
    });

    console.log(`Active chats: ${activeChats.length}`);

    const chatList = await Promise.all(
      activeChats.slice(0, 100).map(async (chat) => {
        try {
          const contact = await chat.getContact();
          
          // Определяем имя чата
          let chatName = '';
          if (chat.isGroup) {
            chatName = chat.name || 'Группа';
          } else {
            chatName = contact.name || 
                     contact.pushname || 
                     contact.verifiedName || 
                     contact.formattedName ||
                     (contact.number ? formatDisplayNumber(contact.number) : 'Неизвестный контакт');
          }

          // Обрабатываем номер телефона
          let phoneNumber = '';
          if (!chat.isGroup && contact.number) {
            phoneNumber = contact.number.includes('@') 
              ? contact.number.split('@')[0] 
              : contact.number;
            
            // Форматируем номер для отображения
            if (phoneNumber && !phoneNumber.startsWith('+')) {
              if (phoneNumber.startsWith('7') && phoneNumber.length === 11) {
                phoneNumber = '+' + phoneNumber;
              } else if (phoneNumber.startsWith('8') && phoneNumber.length === 11) {
                phoneNumber = '+7' + phoneNumber.slice(1);
              }
            }
          }

          return {
            id: chat.id._serialized,
            name: chatName,
            number: phoneNumber,
            lastMessage: chat.lastMessage?.body || '',
            lastMessageTime: chat.lastMessage?.timestamp ? new Date(chat.lastMessage.timestamp * 1000) : null,
            unreadCount: chat.unreadCount || 0,
            isGroup: chat.isGroup,
            isArchived: chat.archived || false,
            isMuted: chat.isMuted || false,
            isOnline: false, // WhatsApp Web API не предоставляет статус онлайн
            messages: [] // Сообщения загружаются отдельно
          };
        } catch (contactError) {
          console.error('Error processing chat:', chat.id._serialized, contactError);
          // Возвращаем базовую информацию для проблемных чатов
          return {
            id: chat.id._serialized,
            name: chat.name || chat.id._serialized,
            number: '',
            lastMessage: chat.lastMessage?.body || '',
            lastMessageTime: chat.lastMessage?.timestamp ? new Date(chat.lastMessage.timestamp * 1000) : null,
            unreadCount: chat.unreadCount || 0,
            isGroup: chat.isGroup,
            isArchived: false,
            isMuted: false,
            isOnline: false,
            messages: []
          };
        }
      })
    );

    // Сортируем чаты по времени последнего сообщения
    const sortedChats = chatList
      .filter(chat => chat !== null)
      .sort((a, b) => {
        // Сначала непрочитанные
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
        if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
        
        // Потом по времени
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
      });

    console.log(`Processed ${sortedChats.length} chats successfully`);

    return NextResponse.json({ 
      success: true, 
      chats: sortedChats,
      totalChats: chats.length,
      activeChats: activeChats.length
    });
  } catch (error) {
    console.error('Error getting chats:', error);
    
    // Если ошибка связана с закрытым соединением, пытаемся переподключиться
    if (error instanceof Error && error.message.includes('Target closed')) {
      console.log('Target closed detected, resetting WhatsApp client...');
      whatsappClient = null;
      isClientReady = false;
      qrCodeData = null;
      
      return NextResponse.json({ 
        error: 'Connection lost, please reconnect', 
        details: 'WhatsApp connection was closed',
        shouldReconnect: true
      }, { status: 503 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to get chats', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Вспомогательная функция для форматирования номера для отображения
function formatDisplayNumber(number: string): string {
  if (!number) return '';
  
  // Убираем префикс @c.us если есть
  const cleanNumber = number.includes('@') ? number.split('@')[0] : number;
  
  // Форматируем российские номера
  if (cleanNumber.startsWith('7') && cleanNumber.length === 11) {
    const formatted = '+7 (' + cleanNumber.slice(1, 4) + ') ' + 
                     cleanNumber.slice(4, 7) + '-' + 
                     cleanNumber.slice(7, 9) + '-' + 
                     cleanNumber.slice(9, 11);
    return formatted;
  }
  
  // Для других номеров просто добавляем +
  return cleanNumber.startsWith('+') ? cleanNumber : '+' + cleanNumber;
}

async function processIncomingMessage(message: Message) {
  try {
    const conversationId = getConversationId(message)
    if (!conversationId) {
      return
    }

    const content = message.body?.trim() ?? ''
    if (content.length === 0) {
      return
    }

    let formType: FormType = 'lesson_booking'
    let autoCommitFlag = false

    try {
      const existingDraft = await conversationDraftRepository.getDraftByConversation(conversationId)
      if (existingDraft?.formType === 'lesson_booking' || existingDraft?.formType === 'student_registration' || existingDraft?.formType === 'consultation') {
        formType = existingDraft.formType as FormType
      }
      autoCommitFlag = existingDraft?.autoCommit ?? false
    } catch (error) {
      console.error('Failed to load conversation draft:', error)
    }

    try {
      const result = await extractorService.processMessage({
        conversationId,
        formType,
        messageId: message.id._serialized,
        content,
        senderType: message.fromMe ? 'bot' : 'user',
        autoCommit: autoCommitFlag,
        metadata: {
          whatsapp: {
            from: message.from,
            to: message.to,
            id: message.id._serialized,
            type: message.type,
            timestamp: message.timestamp,
            fromMe: message.fromMe,
          },
        },
      })

      broadcastWhatsAppUpdate({
        type: 'extractor_update',
        chatId: conversationId,
        data: {
          draft: {
            id: result.draft.id,
            formType,
            autoCommit: autoCommitFlag,
            isComplete: result.isComplete,
            draftData: result.draft.draftData,
            updatedAt: result.draft.updatedAt,
          },
          changedFields: result.changedFields,
          missingFields: result.missingFields,
          violations: result.violations,
          reasons: result.reasons,
          overallConfidence: result.overallConfidence,
          fieldConfidences: result.fieldConfidences,
        },
      })
    } catch (error) {
      console.error('Extractor processing error:', error)
      broadcastWhatsAppUpdate({
        type: 'extractor_error',
        chatId: conversationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  } catch (error) {
    console.error('Unhandled WhatsApp message processing error:', error)
  }
}

function getConversationId(message: Message): string | null {
  const id = message.fromMe ? message.to : message.from
  if (!id) {
    return null
  }
  return id
}

async function getContacts() {
  if (!whatsappClient || !isClientReady) {
    return NextResponse.json({ error: 'WhatsApp client not ready' }, { status: 400 });
  }

  try {
    const contacts = await whatsappClient.getContacts();
    const contactList = contacts
      .filter(contact => !contact.isGroup && !contact.isMe)
      .slice(0, 100) // Ограничиваем до 100 контактов
      .map(contact => ({
        id: contact.id._serialized,
        name: contact.name || contact.pushname || contact.number,
        number: contact.number,
        isOnline: false, // WhatsApp Web не предоставляет статус онлайн
        lastSeen: null
      }));

    return NextResponse.json({ 
      success: true, 
      contacts: contactList 
    });
  } catch (error) {
    console.error('Error getting contacts:', error);
    return NextResponse.json({ error: 'Failed to get contacts' }, { status: 500 });
  }
}

async function getChatMessages(chatId: string, limit: number = 50) {
  if (!whatsappClient || !isClientReady) {
    return NextResponse.json({ error: 'WhatsApp client not ready' }, { status: 400 });
  }

  try {
    console.log(`Loading messages for chat: ${chatId} (limit: ${limit})`);
    const chat = await whatsappClient.getChatById(chatId);
    
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Загружаем сообщения с ограничением для производительности
    const messages = await chat.fetchMessages({ limit: Math.min(limit, 200) });
    console.log(`Found ${messages.length} messages in chat ${chatId}`);

    const messageList = messages
      .filter(message => message.body && message.body.trim()) // Фильтруем пустые сообщения
      .map(message => {
        // Определяем статус сообщения
        let status = 'sent';
        if (message.fromMe) {
          switch (message.ack) {
            case 0:
              status = 'sending';
              break;
            case 1:
              status = 'sent';
              break;
            case 2:
              status = 'delivered';
              break;
            case 3:
              status = 'read';
              break;
            default:
              status = 'sent';
          }
        } else {
          status = 'read'; // Входящие сообщения считаем прочитанными
        }

        return {
          id: message.id._serialized,
          chatId: chatId,
          text: message.body || '',
          timestamp: new Date(message.timestamp * 1000),
          fromMe: message.fromMe,
          status: status,
          type: message.type || 'chat', // тип сообщения (chat, image, audio, etc.)
          hasMedia: message.hasMedia || false
        };
      })
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()); // Сортируем по времени (старые сначала)

    console.log(`Processed ${messageList.length} messages for chat ${chatId}`);

    return NextResponse.json({ 
      success: true, 
      messages: messageList,
      chatId: chatId,
      totalMessages: messages.length,
      hasMore: messages.length >= limit
    });
  } catch (error) {
    console.error('Error getting chat messages:', error);
    return NextResponse.json({ 
      error: 'Failed to get messages', 
      details: error instanceof Error ? error.message : 'Unknown error',
      chatId: chatId
    }, { status: 500 });
  }
}