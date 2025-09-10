# Архитектура CRM_K - Система управления учениками

## Обзор проекта

CRM_K - это система управления учениками, расписанием и финансами, построенная на основе принципов чистой архитектуры (Clean Architecture). Проект использует Next.js 15, TypeScript, Prisma ORM и SQLite базу данных.

## Принципы архитектуры

### Clean Architecture
Проект следует принципам чистой архитектуры Роберта Мартина:
- **Независимость от фреймворков** - бизнес-логика не зависит от Next.js
- **Тестируемость** - бизнес-логика может быть протестирована без UI, базы данных или внешних сервисов
- **Независимость от UI** - UI может быть легко изменен без изменения бизнес-логики
- **Независимость от базы данных** - можно заменить SQLite на PostgreSQL или MySQL
- **Независимость от внешних сервисов** - бизнес-логика не знает о внешнем мире

## Структура проекта

```
src/
├── domain/                    # Доменный слой (бизнес-логика)
│   ├── entities/             # Сущности домена
│   │   ├── Student.ts        # Сущность ученика
│   │   ├── Lesson.ts         # Сущность урока
│   │   ├── User.ts           # Сущность пользователя
│   │   ├── Payment.ts        # Сущность платежа
│   │   ├── Toy.ts            # Сущность игрушки
│   │   ├── AISuggestion.ts   # Сущность предложения ИИ
│   │   └── index.ts          # Экспорт всех сущностей
│   ├── repositories/         # Интерфейсы репозиториев
│   │   ├── IStudentRepository.ts
│   │   ├── ILessonRepository.ts
│   │   ├── IUserRepository.ts
│   │   ├── IPaymentRepository.ts
│   │   └── index.ts
│   ├── services/             # Доменные сервисы
│   │   ├── FinancialService.ts
│   │   ├── LessonService.ts
│   │   ├── AIService.ts
│   │   └── index.ts
│   └── index.ts              # Экспорт доменного слоя
├── application/              # Слой приложения (Use Cases)
│   ├── use-cases/           # Сценарии использования
│   │   ├── student/         # Use cases для учеников
│   │   │   ├── GetStudentsUseCase.ts
│   │   │   ├── CreateStudentUseCase.ts
│   │   │   ├── UpdateStudentUseCase.ts
│   │   │   └── DeleteStudentUseCase.ts
│   │   ├── lesson/          # Use cases для уроков
│   │   │   ├── GetLessonsUseCase.ts
│   │   │   ├── CreateLessonUseCase.ts
│   │   │   └── UpdateLessonUseCase.ts
│   │   ├── auth/            # Use cases для аутентификации
│   │   │   └── LoginUseCase.ts
│   │   ├── finance/         # Use cases для финансов
│   │   │   └── GetFinancialStatsUseCase.ts
│   │   └── index.ts
│   ├── dto/                 # Data Transfer Objects
│   │   ├── StudentDTO.ts
│   │   ├── LessonDTO.ts
│   │   └── index.ts
│   └── index.ts
├── infrastructure/          # Слой инфраструктуры
│   ├── database/           # Работа с базой данных
│   │   ├── db.ts           # Prisma клиент
│   │   └── index.ts
│   ├── repositories/       # Реализации репозиториев
│   │   ├── StudentRepository.ts
│   │   ├── LessonRepository.ts
│   │   ├── UserRepository.ts
│   │   └── index.ts
│   ├── external/           # Внешние сервисы
│   └── index.ts
├── presentation/           # Слой презентации (UI)
│   ├── contexts/          # React контексты
│   │   ├── AuthContext.tsx
│   │   ├── ToastContext.tsx
│   │   └── index.ts
│   ├── hooks/             # Кастомные хуки
│   │   ├── useToast.ts
│   │   └── index.ts
│   ├── components/        # React компоненты (существующие)
│   └── index.ts
├── shared/                # Общие утилиты и константы
│   ├── constants/         # Константы приложения
│   │   └── index.ts
│   ├── utils/             # Утилиты
│   │   └── index.ts
│   ├── types/             # Общие типы
│   │   └── index.ts
│   └── index.ts
├── app/                   # Next.js App Router
│   ├── api/              # API маршруты
│   ├── admin/            # Админ панель
│   ├── students/         # Страницы учеников
│   ├── schedule/         # Страница расписания
│   ├── finances/         # Финансовая отчетность
│   ├── login/            # Страница входа
│   ├── layout.tsx        # Корневой layout
│   ├── page.tsx          # Главная страница
│   └── globals.css       # Глобальные стили
└── index.ts              # Главный экспорт
```

## Описание слоев

### 1. Domain Layer (Доменный слой)

**Назначение**: Содержит бизнес-логику и правила приложения.

**Компоненты**:
- **Entities** - Основные бизнес-объекты (Student, Lesson, User, Payment, Toy, AISuggestion)
- **Repositories** - Интерфейсы для доступа к данным
- **Services** - Доменные сервисы для сложной бизнес-логики

**Принципы**:
- Не зависит от внешних слоев
- Содержит только бизнес-логику
- Интерфейсы, а не реализации

### 2. Application Layer (Слой приложения)

**Назначение**: Координирует выполнение бизнес-логики.

**Компоненты**:
- **Use Cases** - Сценарии использования приложения
- **DTOs** - Объекты для передачи данных между слоями

**Принципы**:
- Зависит только от Domain Layer
- Содержит логику приложения
- Координирует работу доменных объектов

### 3. Infrastructure Layer (Слой инфраструктуры)

**Назначение**: Реализует технические детали.

**Компоненты**:
- **Database** - Работа с базой данных (Prisma)
- **Repositories** - Реализации интерфейсов репозиториев
- **External** - Интеграции с внешними сервисами

**Принципы**:
- Реализует интерфейсы из Domain Layer
- Содержит технические детали
- Может зависеть от внешних библиотек

### 4. Presentation Layer (Слой презентации)

**Назначение**: Пользовательский интерфейс.

**Компоненты**:
- **Contexts** - React контексты для управления состоянием
- **Hooks** - Кастомные React хуки
- **Components** - React компоненты (существующие)

**Принципы**:
- Зависит от Application Layer
- Содержит UI логику
- Использует Use Cases для выполнения операций

### 5. Shared Layer (Общий слой)

**Назначение**: Общие утилиты и константы.

**Компоненты**:
- **Constants** - Константы приложения
- **Utils** - Утилиты
- **Types** - Общие типы

## Основные сущности

### Student (Ученик)
```typescript
interface Student {
  id: number;
  fullName: string;
  phone: string;
  age: number;
  parentName: string;
  diagnosis?: string;
  comment?: string;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Lesson (Урок)
```typescript
interface Lesson {
  id: number;
  date: Date;
  endTime: Date;
  studentId: number;
  cost: number;
  isCompleted: boolean;
  isPaid: boolean;
  isCancelled: boolean;
  notes?: string;
  lessonType: 'individual' | 'group';
  location: 'office' | 'online' | 'home';
  createdAt: Date;
  updatedAt: Date;
}
```

### User (Пользователь)
```typescript
interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}
```

### Payment (Платеж)
```typescript
interface Payment {
  id: number;
  studentId: number;
  amount: number;
  date: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Use Cases (Сценарии использования)

### Student Use Cases
- **GetStudentsUseCase** - Получение списка учеников
- **CreateStudentUseCase** - Создание нового ученика
- **UpdateStudentUseCase** - Обновление данных ученика
- **DeleteStudentUseCase** - Удаление ученика

### Lesson Use Cases
- **GetLessonsUseCase** - Получение списка уроков
- **CreateLessonUseCase** - Создание нового урока
- **UpdateLessonUseCase** - Обновление урока

### Auth Use Cases
- **LoginUseCase** - Аутентификация пользователя

### Finance Use Cases
- **GetFinancialStatsUseCase** - Получение финансовой статистики

## Репозитории

### IStudentRepository
```typescript
interface IStudentRepository {
  findAll(userId?: number): Promise<Student[]>;
  findById(id: number): Promise<Student | null>;
  create(data: CreateStudentData): Promise<Student>;
  update(data: UpdateStudentData): Promise<Student>;
  delete(id: number): Promise<void>;
  findByUserId(userId: number): Promise<Student[]>;
}
```

### ILessonRepository
```typescript
interface ILessonRepository {
  findAll(userId?: number): Promise<LessonWithStudent[]>;
  findById(id: number): Promise<LessonWithStudent | null>;
  create(data: CreateLessonData): Promise<Lesson>;
  update(data: UpdateLessonData): Promise<Lesson>;
  delete(id: number): Promise<void>;
  findByStudentId(studentId: number): Promise<Lesson[]>;
  findByDateRange(startDate: Date, endDate: Date, userId?: number): Promise<LessonWithStudent[]>;
  findUnpaidLessons(userId?: number): Promise<LessonWithStudent[]>;
}
```

## Доменные сервисы

### FinancialService
Обрабатывает финансовую логику:
- Расчет статистики доходов
- Управление долгами
- Генерация отчетов
- Экспорт данных

### LessonService
Обрабатывает логику уроков:
- Определение статуса урока
- Автоматическое обновление статусов
- Валидация данных уроков

### AIService
Интеграция с ИИ для генерации предложений:
- Генерация предложений для уроков
- Получение рекомендаций для учеников

## API Маршруты

### Аутентификация
- `POST /api/auth/login` - Вход в систему

### Ученики
- `GET /api/students` - Получение списка учеников
- `POST /api/students` - Создание ученика
- `GET /api/students/[id]` - Получение ученика по ID
- `PUT /api/students/[id]` - Обновление ученика
- `DELETE /api/students/[id]` - Удаление ученика

### Уроки
- `GET /api/lessons` - Получение списка уроков
- `POST /api/lessons` - Создание урока
- `GET /api/lessons/[id]` - Получение урока по ID
- `PUT /api/lessons/[id]` - Обновление урока
- `DELETE /api/lessons/[id]` - Удаление урока
- `POST /api/lessons/auto-update-status` - Автообновление статусов

### Платежи
- `GET /api/payments` - Получение списка платежей
- `POST /api/payments` - Создание платежа
- `GET /api/payments/unpaid-lessons` - Получение неоплаченных уроков

### Финансы
- `GET /api/finances/stats` - Финансовая статистика
- `GET /api/finances/chart` - Данные для графиков
- `GET /api/finances/debts` - Список долгов
- `GET /api/finances/export` - Экспорт данных
- `GET /api/finances/period` - Статистика по периодам
- `GET /api/finances/students/[id]` - Финансовый отчет по ученику

### Админ панель
- `GET /api/admin/stats` - Общая статистика
- `GET /api/admin/users` - Управление пользователями
- `GET /api/admin/toys` - Управление игрушками

### ИИ
- `GET /api/ai/suggestions/[studentId]` - Предложения для ученика
- `POST /api/ai/lesson-suggestions` - Генерация предложений урока

## База данных

### Схема Prisma
```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  name      String
  role      UserRole @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  students  Student[]
}

model Student {
  id          Int      @id @default(autoincrement())
  fullName    String
  phone       String
  age         Int
  parentName  String
  diagnosis   String?
  comment     String?
  userId      Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  lessons     Lesson[]
  payments    Payment[]
  aiSuggestions AISuggestion[]
}

model Lesson {
  id          Int      @id @default(autoincrement())
  date        DateTime
  endTime     DateTime
  studentId   Int
  cost        Float
  isCompleted Boolean  @default(false)
  isPaid      Boolean  @default(false)
  isCancelled Boolean  @default(false)
  notes       String?
  lessonType  String   @default("individual")
  location    String   @default("office")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  student     Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  payments    PaymentLesson[]
}

model Payment {
  id          Int      @id @default(autoincrement())
  studentId   Int
  amount      Float
  date        DateTime
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  student     Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  lessons     PaymentLesson[]
}

model PaymentLesson {
  id        Int     @id @default(autoincrement())
  paymentId Int
  lessonId  Int
  
  payment   Payment @relation(fields: [paymentId], references: [id], onDelete: Cascade)
  lesson    Lesson  @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  
  @@unique([paymentId, lessonId])
}

model Toy {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  category    String?
  isAvailable Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model AISuggestion {
  id          Int      @id @default(autoincrement())
  studentId   Int
  title       String
  duration    String
  goals       String
  materials   String
  structure   String
  recommendations String
  expectedResults String
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  student     Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
}

enum UserRole {
  ADMIN
  USER
}
```

## Технологический стек

### Frontend
- **Next.js 15** - React фреймворк с App Router
- **TypeScript** - Типизированный JavaScript
- **Tailwind CSS** - Utility-first CSS фреймворк
- **React 19** - Библиотека для создания UI
- **Lucide React** - Иконки

### Backend
- **Next.js API Routes** - API endpoints
- **Prisma ORM** - Работа с базой данных
- **SQLite** - База данных
- **bcryptjs** - Хеширование паролей
- **jsonwebtoken** - JWT токены

### Дополнительные библиотеки
- **Recharts** - Графики и диаграммы
- **XLSX** - Экспорт в Excel
- **Google GenAI** - ИИ интеграция

## Безопасность

### Аутентификация
- JWT токены для сессий
- Хеширование паролей с bcrypt
- Роли пользователей (ADMIN/USER)

### Авторизация
- Middleware для проверки токенов
- Разделение доступа по ролям
- Защищенные маршруты

### Валидация
- Валидация входных данных
- Санитизация пользовательского ввода
- Проверка прав доступа

## Производительность

### Оптимизации
- Server-side rendering (SSR)
- Static generation где возможно
- Lazy loading компонентов
- Оптимизация изображений

### Кэширование
- Кэширование API ответов
- Мемоизация вычислений
- Оптимизация запросов к БД

## Тестирование

### Стратегия тестирования
- Unit тесты для бизнес-логики
- Integration тесты для API
- E2E тесты для критических сценариев

### Инструменты
- Jest - Unit тестирование
- React Testing Library - Тестирование компонентов
- Playwright - E2E тестирование

## Развертывание

### Локальная разработка
```bash
npm install
npm run dev
```

### Продакшн
```bash
npm run build
npm start
```

### База данных
```bash
npx prisma migrate deploy
npm run db:seed
```

## Мониторинг и логирование

### Логирование
- Структурированные логи
- Различные уровни логирования
- Отслеживание ошибок

### Мониторинг
- Отслеживание производительности
- Мониторинг ошибок
- Аналитика использования

## Будущие улучшения

### Планируемые функции
- Мобильное приложение
- Уведомления в реальном времени
- Расширенная аналитика
- Интеграция с календарями
- Многопользовательские сессии

### Технические улучшения
- Миграция на PostgreSQL
- Внедрение Redis для кэширования
- Микросервисная архитектура
- GraphQL API
- PWA функциональность

## Заключение

Проект CRM_K построен с использованием принципов чистой архитектуры, что обеспечивает:

- **Масштабируемость** - Легко добавлять новые функции
- **Тестируемость** - Бизнес-логика изолирована и тестируема
- **Поддерживаемость** - Четкое разделение ответственности
- **Гибкость** - Возможность замены компонентов без влияния на другие слои

Архитектура позволяет легко расширять функциональность, добавлять новые интеграции и поддерживать код в долгосрочной перспективе.
