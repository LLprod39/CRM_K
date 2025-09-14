# Настройка автоматической отправки уведомлений

## Проблема
Запланированные уведомления не отправляются автоматически, потому что notification-worker не запущен.

## Решение

### Вариант 1: Ручной запуск (для тестирования)
```bash
# Запуск worker один раз
node scripts/notification-worker.js

# Запуск worker каждые 5 минут
node scripts/start-notification-worker.js
```

### Вариант 2: Windows Task Scheduler (рекомендуется для продакшена)

1. Откройте **Планировщик заданий Windows** (Task Scheduler)
2. Создайте новое задание:
   - **Имя**: CRM Notification Worker
   - **Триггер**: Каждые 5 минут
   - **Действие**: Запуск программы
   - **Программа**: `node`
   - **Аргументы**: `scripts/notification-worker.js`
   - **Рабочая папка**: `C:\cloude\хуйня\crm_k\crm_k`

### Вариант 3: PM2 (если установлен)
```bash
# Установка PM2
npm install -g pm2

# Запуск worker через PM2
pm2 start scripts/start-notification-worker.js --name "notification-worker"

# Автозапуск при перезагрузке
pm2 startup
pm2 save
```

## Проверка работы

### Проверить статус уведомлений:
```bash
node scripts/check-notifications.js
```

### Проверить статистику worker'а:
```bash
curl http://localhost:3000/api/notifications/worker
```

### Ручная обработка уведомлений:
```bash
curl -X POST http://localhost:3000/api/notifications/worker -H "Authorization: Bearer secret-worker-token"
```

## Текущий статус
- ✅ Уведомления сохраняются в базу данных
- ✅ Worker API работает корректно
- ❌ Worker не запущен автоматически
- ✅ Тестовые уведомления работают

## Следующие шаги
1. Настроить автоматический запуск worker'а
2. Проверить работу в течение дня
3. Настроить мониторинг ошибок
