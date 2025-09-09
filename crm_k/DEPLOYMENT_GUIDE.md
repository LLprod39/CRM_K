# Руководство по развертыванию CRM_K

## Обзор

CRM_K - это Next.js приложение, которое можно развернуть на различных платформах. В этом руководстве описаны различные способы развертывания.

## Предварительные требования

- Node.js 18+ 
- npm или yarn
- База данных (SQLite для разработки, PostgreSQL/MySQL для продакшена)

## Локальное развертывание

### 1. Клонирование репозитория

```bash
git clone https://github.com/your-username/CRM_K.git
cd CRM_K
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка базы данных

```bash
# Создание миграций
npx prisma migrate dev

# Заполнение тестовыми данными
npm run db:seed
```

### 4. Запуск в режиме разработки

```bash
npm run dev
```

Приложение будет доступно по адресу: http://localhost:3000

### 5. Сборка для продакшена

```bash
npm run build
npm start
```

## Развертывание на Vercel

Vercel - рекомендуемая платформа для Next.js приложений.

### 1. Подготовка проекта

Создайте файл `vercel.json`:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "outputDirectory": ".next"
}
```

### 2. Настройка переменных окружения

В панели Vercel добавьте переменные:

```
DATABASE_URL=your_database_url
NODE_ENV=production
```

### 3. Развертывание

```bash
# Установка Vercel CLI
npm i -g vercel

# Развертывание
vercel

# Продакшен развертывание
vercel --prod
```

### 4. Настройка базы данных

Для продакшена рекомендуется использовать PostgreSQL:

```bash
# Создание базы данных
npx prisma migrate deploy

# Заполнение начальными данными
npm run db:seed
```

## Развертывание на Railway

Railway предоставляет простой способ развертывания с встроенной базой данных.

### 1. Подключение GitHub

1. Зайдите на [Railway](https://railway.app)
2. Подключите GitHub репозиторий
3. Выберите проект CRM_K

### 2. Настройка базы данных

Railway автоматически создаст PostgreSQL базу данных и предоставит `DATABASE_URL`.

### 3. Переменные окружения

```
NODE_ENV=production
```

### 4. Развертывание

Railway автоматически развернет приложение при push в main ветку.

## Развертывание на DigitalOcean

### 1. Создание Droplet

```bash
# Создание Ubuntu 22.04 Droplet
# Минимальные требования: 1GB RAM, 1 CPU
```

### 2. Установка зависимостей

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка PM2
sudo npm install -g pm2

# Установка Nginx
sudo apt install nginx -y
```

### 3. Настройка приложения

```bash
# Клонирование репозитория
git clone https://github.com/your-username/CRM_K.git
cd CRM_K

# Установка зависимостей
npm install

# Сборка приложения
npm run build

# Настройка базы данных
npx prisma migrate deploy
```

### 4. Настройка PM2

Создайте файл `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'crm-k',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/CRM_K',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: 'your_database_url'
    }
  }]
};
```

Запуск:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5. Настройка Nginx

Создайте файл `/etc/nginx/sites-available/crm-k`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активация:

```bash
sudo ln -s /etc/nginx/sites-available/crm-k /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. SSL сертификат

```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx -y

# Получение SSL сертификата
sudo certbot --nginx -d your-domain.com
```

## Развертывание с Docker

### 1. Создание Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 2. Создание docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/crm_k
      - NODE_ENV=production
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=crm_k
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### 3. Запуск

```bash
# Сборка и запуск
docker-compose up -d

# Выполнение миграций
docker-compose exec app npx prisma migrate deploy

# Заполнение данными
docker-compose exec app npm run db:seed
```

## Настройка базы данных

### SQLite (разработка)

```bash
# Создание базы данных
npx prisma migrate dev

# Заполнение данными
npm run db:seed
```

### PostgreSQL (продакшен)

```bash
# Создание базы данных
createdb crm_k

# Настройка переменной окружения
export DATABASE_URL="postgresql://user:password@localhost:5432/crm_k"

# Выполнение миграций
npx prisma migrate deploy

# Заполнение данными
npm run db:seed
```

### MySQL (продакшен)

```bash
# Создание базы данных
mysql -u root -p -e "CREATE DATABASE crm_k;"

# Настройка переменной окружения
export DATABASE_URL="mysql://user:password@localhost:3306/crm_k"

# Выполнение миграций
npx prisma migrate deploy

# Заполнение данными
npm run db:seed
```

## Мониторинг и логирование

### 1. PM2 мониторинг

```bash
# Просмотр статуса
pm2 status

# Просмотр логов
pm2 logs crm-k

# Мониторинг в реальном времени
pm2 monit
```

### 2. Nginx логи

```bash
# Логи доступа
sudo tail -f /var/log/nginx/access.log

# Логи ошибок
sudo tail -f /var/log/nginx/error.log
```

### 3. Системные логи

```bash
# Логи системы
sudo journalctl -u nginx -f

# Логи PM2
pm2 logs --lines 100
```

## Резервное копирование

### 1. База данных

```bash
# PostgreSQL
pg_dump crm_k > backup_$(date +%Y%m%d_%H%M%S).sql

# MySQL
mysqldump -u user -p crm_k > backup_$(date +%Y%m%d_%H%M%S).sql

# SQLite
cp dev.db backup_$(date +%Y%m%d_%H%M%S).db
```

### 2. Автоматическое резервное копирование

Создайте скрипт `backup.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/path/to/backups"
DB_NAME="crm_k"

# Создание директории для бэкапов
mkdir -p $BACKUP_DIR

# Резервное копирование базы данных
pg_dump $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Удаление старых бэкапов (старше 30 дней)
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete

echo "Backup completed: backup_$DATE.sql"
```

Добавьте в crontab:

```bash
# Ежедневное резервное копирование в 2:00
0 2 * * * /path/to/backup.sh
```

## Обновление приложения

### 1. Обновление кода

```bash
# Получение обновлений
git pull origin main

# Установка новых зависимостей
npm install

# Сборка приложения
npm run build

# Выполнение миграций
npx prisma migrate deploy

# Перезапуск приложения
pm2 restart crm-k
```

### 2. Откат изменений

```bash
# Откат к предыдущей версии
git checkout HEAD~1

# Пересборка и перезапуск
npm run build
pm2 restart crm-k
```

## Безопасность

### 1. Переменные окружения

```bash
# Никогда не коммитьте .env файлы
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore
```

### 2. Firewall

```bash
# Настройка UFW
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 3. SSL/TLS

```bash
# Автоматическое обновление сертификатов
sudo crontab -e

# Добавьте строку:
0 12 * * * /usr/bin/certbot renew --quiet
```

## Производительность

### 1. Кэширование

```bash
# Настройка Redis для кэширования
sudo apt install redis-server -y
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### 2. CDN

Используйте CDN для статических ресурсов:

```javascript
// next.config.js
module.exports = {
  assetPrefix: 'https://cdn.yourdomain.com',
}
```

### 3. Мониторинг

```bash
# Установка htop для мониторинга
sudo apt install htop -y

# Мониторинг в реальном времени
htop
```

## Troubleshooting

### 1. Проблемы с базой данных

```bash
# Проверка подключения
npx prisma db pull

# Сброс базы данных
npx prisma migrate reset

# Пересоздание базы данных
npx prisma migrate dev
```

### 2. Проблемы с памятью

```bash
# Очистка кэша npm
npm cache clean --force

# Очистка node_modules
rm -rf node_modules
npm install
```

### 3. Проблемы с портами

```bash
# Проверка занятых портов
sudo netstat -tulpn | grep :3000

# Освобождение порта
sudo kill -9 PID
```

## Заключение

Это руководство покрывает основные способы развертывания CRM_K. Выберите подходящий метод в зависимости от ваших требований и бюджета.

Для получения дополнительной помощи обратитесь к документации Next.js или создайте issue в репозитории проекта.
