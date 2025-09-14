#!/usr/bin/env node

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testWorkerIntegration() {
  try {
    console.log('🧪 Тестирование интеграции notification worker...\n');

    // 1. Проверяем статус worker'а
    console.log('1. Проверка статуса worker\'а...');
    const statusResponse = await fetch(`${BASE_URL}/api/notifications/worker-manager`);
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ Статус worker\'а:', statusData.status);
    } else {
      console.log('❌ Ошибка получения статуса:', statusResponse.status);
    }

    // 2. Запускаем worker
    console.log('\n2. Запуск worker\'а...');
    const startResponse = await fetch(`${BASE_URL}/api/notifications/worker-manager`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (startResponse.ok) {
      const startData = await startResponse.json();
      console.log('✅ Worker запущен:', startData.message);
    } else {
      console.log('❌ Ошибка запуска worker\'а:', startResponse.status);
    }

    // 3. Проверяем статус снова
    console.log('\n3. Проверка статуса после запуска...');
    const statusResponse2 = await fetch(`${BASE_URL}/api/notifications/worker-manager`);
    
    if (statusResponse2.ok) {
      const statusData2 = await statusResponse2.json();
      console.log('✅ Статус worker\'а:', statusData2.status);
    }

    // 4. Изменение интервала
    console.log('\n4. Изменение интервала на 2 минуты...');
    const intervalResponse = await fetch(`${BASE_URL}/api/notifications/worker-manager`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        intervalMs: 2 * 60 * 1000 // 2 минуты
      })
    });

    if (intervalResponse.ok) {
      const intervalData = await intervalResponse.json();
      console.log('✅ Интервал изменен:', intervalData.message);
    } else {
      console.log('❌ Ошибка изменения интервала:', intervalResponse.status);
    }

    // 5. Проверка нового статуса
    console.log('\n5. Проверка статуса после изменения интервала...');
    const statusResponse3 = await fetch(`${BASE_URL}/api/notifications/worker-manager`);
    
    if (statusResponse3.ok) {
      const statusData3 = await statusResponse3.json();
      console.log('✅ Новый статус worker\'а:', statusData3.status);
    }

    // 6. Ручная обработка уведомлений
    console.log('\n6. Ручная обработка уведомлений...');
    const processResponse = await fetch(`${BASE_URL}/api/notifications/worker-manager`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (processResponse.ok) {
      const processData = await processResponse.json();
      console.log('✅ Обработка завершена:', processData.message);
      console.log('📊 Результаты:', processData.results);
    } else {
      console.log('❌ Ошибка обработки:', processResponse.status);
    }

    console.log('\n🎉 Тестирование завершено!');

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
  }
}

testWorkerIntegration();
