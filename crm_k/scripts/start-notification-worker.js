#!/usr/bin/env node

/**
 * Скрипт для автоматического запуска notification-worker
 * Запускается каждые 5 минут для обработки запланированных уведомлений
 */

const { processNotifications } = require('./notification-worker');

async function startWorker() {
  console.log(`[${new Date().toISOString()}] Запуск notification worker...`);
  
  try {
    await processNotifications();
    console.log(`[${new Date().toISOString()}] Worker завершен успешно`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Ошибка в worker:`, error.message);
  }
}

// Запускаем worker каждые 5 минут
const interval = 5 * 60 * 1000; // 5 минут в миллисекундах

console.log(`[${new Date().toISOString()}] Запуск notification worker каждые 5 минут...`);
console.log('Для остановки нажмите Ctrl+C');

// Запускаем сразу
startWorker();

// Затем каждые 5 минут
setInterval(startWorker, interval);
