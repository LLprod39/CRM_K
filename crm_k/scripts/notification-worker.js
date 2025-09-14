#!/usr/bin/env node

/**
 * Скрипт для периодической отправки запланированных уведомлений
 * Запускается через cron job каждые 5 минут
 * 
 * Пример cron job (каждые 5 минут):
 * */5 * * * * cd /path/to/project && node scripts/notification-worker.js
 */

const fetch = require('node-fetch');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const WORKER_TOKEN = process.env.NOTIFICATION_WORKER_TOKEN || 'secret-worker-token';

async function processNotifications() {
  try {
    console.log(`[${new Date().toISOString()}] Starting notification worker...`);
    
    const response = await fetch(`${BASE_URL}/api/notifications/worker`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WORKER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();
    
    console.log(`[${new Date().toISOString()}] Worker completed:`, {
      processed: result.results.processed,
      sent: result.results.sent,
      failed: result.results.failed
    });

    if (result.results.errors.length > 0) {
      console.error('Errors occurred:', result.results.errors);
    }

    return result;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Worker error:`, error.message);
    throw error;
  }
}

async function scheduleDailySummaries() {
  try {
    console.log(`[${new Date().toISOString()}] Scheduling daily summaries...`);
    
    const response = await fetch(`${BASE_URL}/api/notifications/schedule`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ type: 'daily' })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    console.log(`[${new Date().toISOString()}] Daily summaries scheduled successfully`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error scheduling daily summaries:`, error.message);
  }
}

async function scheduleWeeklySummaries() {
  try {
    console.log(`[${new Date().toISOString()}] Scheduling weekly summaries...`);
    
    const response = await fetch(`${BASE_URL}/api/notifications/schedule`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ type: 'weekly' })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    console.log(`[${new Date().toISOString()}] Weekly summaries scheduled successfully`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error scheduling weekly summaries:`, error.message);
  }
}

async function main() {
  try {
    // Обрабатываем запланированные уведомления
    await processNotifications();
    
    // Планируем ежедневные сводки (выполняется каждый час в :00 минут)
    const now = new Date();
    if (now.getMinutes() === 0) {
      await scheduleDailySummaries();
    }
    
    // Планируем еженедельные сводки (выполняется каждый день в полночь)
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      await scheduleWeeklySummaries();
    }
    
    console.log(`[${new Date().toISOString()}] All tasks completed successfully`);
    process.exit(0);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Fatal error:`, error);
    process.exit(1);
  }
}

// Запускаем только если это основной модуль
if (require.main === module) {
  main();
}

module.exports = {
  processNotifications,
  scheduleDailySummaries,
  scheduleWeeklySummaries
};
