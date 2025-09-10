# Краткий обзор структуры проекта CRM_K

## 🏗️ Архитектура

Проект построен по принципам **Clean Architecture** с разделением на 5 основных слоев:

```
📁 src/
├── 🎯 domain/          # Бизнес-логика (не зависит ни от чего)
├── 🔄 application/     # Use Cases (зависит только от domain)
├── 🔧 infrastructure/  # Технические детали (реализует domain интерфейсы)
├── 🎨 presentation/    # UI слой (зависит от application)
└── 🔗 shared/          # Общие утилиты (используется всеми слоями)
```

## 📋 Основные сущности

| Сущность | Описание | Ключевые поля |
|----------|----------|---------------|
| **Student** | Ученик | fullName, phone, age, parentName |
| **Lesson** | Урок | date, endTime, cost, isCompleted, isPaid |
| **User** | Пользователь | email, name, role (ADMIN/USER) |
| **Payment** | Платеж | amount, date, studentId |
| **Toy** | Игрушка | name, category, isAvailable |
| **AISuggestion** | Предложение ИИ | title, goals, materials, structure |

## 🔄 Use Cases (Сценарии использования)

### Student Use Cases
- `GetStudentsUseCase` - Получение списка учеников
- `CreateStudentUseCase` - Создание ученика
- `UpdateStudentUseCase` - Обновление ученика
- `DeleteStudentUseCase` - Удаление ученика

### Lesson Use Cases
- `GetLessonsUseCase` - Получение уроков
- `CreateLessonUseCase` - Создание урока
- `UpdateLessonUseCase` - Обновление урока

### Auth Use Cases
- `LoginUseCase` - Аутентификация

### Finance Use Cases
- `GetFinancialStatsUseCase` - Финансовая статистика

## 🗄️ Репозитории

| Интерфейс | Описание | Основные методы |
|-----------|----------|-----------------|
| `IStudentRepository` | Работа с учениками | findAll, findById, create, update, delete |
| `ILessonRepository` | Работа с уроками | findAll, findByDateRange, findUnpaidLessons |
| `IUserRepository` | Работа с пользователями | findByEmail, validateCredentials |
| `IPaymentRepository` | Работа с платежами | findAll, findByStudentId |

## 🎨 UI Компоненты

### Контексты
- `AuthContext` - Управление аутентификацией
- `ToastContext` - Уведомления

### Хуки
- `useToast` - Работа с уведомлениями

### Страницы
- `/` - Главная страница
- `/students` - Управление учениками
- `/schedule` - Расписание
- `/finances` - Финансы
- `/admin` - Админ панель
- `/login` - Вход в систему

## 🔌 API Endpoints

### Основные маршруты
```
POST   /api/auth/login              # Вход
GET    /api/students                # Список учеников
POST   /api/students                # Создать ученика
GET    /api/lessons                 # Список уроков
POST   /api/lessons                 # Создать урок
GET    /api/finances/stats          # Финансовая статистика
GET    /api/admin/stats             # Админ статистика
```

## 🛠️ Технологии

### Frontend
- **Next.js 15** - React фреймворк
- **TypeScript** - Типизация
- **Tailwind CSS** - Стили
- **React 19** - UI библиотека

### Backend
- **Next.js API Routes** - API
- **Prisma ORM** - База данных
- **SQLite** - База данных
- **JWT** - Аутентификация

### Дополнительно
- **Recharts** - Графики
- **Google GenAI** - ИИ
- **XLSX** - Экспорт

## 🚀 Быстрый старт

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Сборка для продакшна
npm run build

# Запуск продакшн версии
npm start
```

## 📊 База данных

### Основные таблицы
- `users` - Пользователи системы
- `students` - Ученики
- `lessons` - Уроки
- `payments` - Платежи
- `toys` - Игрушки
- `ai_suggestions` - Предложения ИИ

### Связи
- User → Students (1:many)
- Student → Lessons (1:many)
- Student → Payments (1:many)
- Payment → Lessons (many:many)

## 🔐 Безопасность

- **JWT токены** для аутентификации
- **bcrypt** для хеширования паролей
- **Роли пользователей** (ADMIN/USER)
- **Middleware** для проверки доступа

## 📈 Производительность

- **SSR** для быстрой загрузки
- **Кэширование** API ответов
- **Lazy loading** компонентов
- **Оптимизация** запросов к БД

## 🧪 Тестирование

- **Unit тесты** для бизнес-логики
- **Integration тесты** для API
- **E2E тесты** для критических сценариев

## 📝 Документация

- `ARCHITECTURE.md` - Подробная архитектура
- `MIGRATION_GUIDE.md` - Руководство по миграции
- `STRUCTURE_OVERVIEW.md` - Этот файл

## 🔄 Workflow

1. **Domain** - Определяем бизнес-логику
2. **Application** - Создаем Use Cases
3. **Infrastructure** - Реализуем репозитории
4. **Presentation** - Создаем UI
5. **Shared** - Добавляем утилиты

## 💡 Принципы

- **Разделение ответственности** - каждый слой имеет свою роль
- **Инверсия зависимостей** - высокоуровневые модули не зависят от низкоуровневых
- **Единственная ответственность** - каждый класс решает одну задачу
- **Открытость/закрытость** - открыт для расширения, закрыт для модификации
