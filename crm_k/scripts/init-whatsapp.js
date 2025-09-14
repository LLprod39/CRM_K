#!/usr/bin/env node

/**
 * Скрипт для инициализации WhatsApp клиента
 * Использование: node scripts/init-whatsapp.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function initWhatsApp() {
  try {
    console.log('🚀 Инициализация WhatsApp клиента...');
    
    const response = await fetch(`${BASE_URL}/api/whatsapp?action=init`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ WhatsApp клиент успешно инициализирован!');
      console.log(`📱 Статус готовности: ${data.ready ? 'Готов' : 'Не готов'}`);
      
      if (data.qrCode) {
        console.log('📱 QR код доступен для сканирования');
        console.log('💡 Перейдите в админ-панель для просмотра QR кода');
      }
    } else {
      console.log('❌ Ошибка инициализации:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Ошибка при инициализации WhatsApp клиента:', error.message);
    console.log('💡 Убедитесь, что сервер запущен и доступен по адресу:', BASE_URL);
  }
}

async function checkStatus() {
  try {
    console.log('🔍 Проверка статуса WhatsApp клиента...');
    
    const response = await fetch(`${BASE_URL}/api/whatsapp?action=status`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`📱 Статус готовности: ${data.ready ? '✅ Готов' : '❌ Не готов'}`);
    
    if (data.qrCode) {
      console.log('📱 QR код доступен для сканирования');
    }
    
    return data.ready;
    
  } catch (error) {
    console.error('❌ Ошибка при проверке статуса:', error.message);
    return false;
  }
}

async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'init':
      await initWhatsApp();
      break;
    case 'status':
      await checkStatus();
      break;
    default:
      console.log('📖 Использование:');
      console.log('  node scripts/init-whatsapp.js init    - Инициализировать WhatsApp клиент');
      console.log('  node scripts/init-whatsapp.js status  - Проверить статус клиента');
      break;
  }
}

main().catch(console.error);
