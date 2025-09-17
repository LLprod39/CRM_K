Двухмодельная Схема

Модель A: Разговорный оркестратор
Общается «как человек», ведёт slot filling по схеме, отвечает по RAG, предлагает слоты, спрашивает подтверждение.
Модель B: Экстрактор/валидатор (фон)
На каждый ин/аут месседж строит патч к черновику JSON, валидирует по схеме, нормализует значения, считает уверенность. При достижении полноты — формирует кандидат на запись в БД и триггерит отправку (по политике автокоммита или после подтверждения).
Поток Событий

Любое сообщение (пользователь/бот) → очередь → Экстрактор (B):
Вход: история диалога (окно), текущий черновик JSON, JSON Schema, справочники, контекст RAG.
Выход: patch {op: set/unset, path, value, confidence, evidence_span}, missing_fields, reasons.
Менеджер состояния применяет patch (idempotent), ведёт версионирование черновика.
Если required закрыты и валидации пройдены:
Если AUTO_COMMIT=1 и confidence≥threshold → отправка в CRM/БД.
Иначе Модель A просит подтверждение и отправляет после “Ок”.
Конфликт/исправления: патч с более свежим message_id и высокой уверенностью перезаписывает значения; хранится audit trail.
Валидация и Нормализация

Строгая JSON Schema (тип, формат, enum, зависимости).
Нормализация: телефон (E.164), дата/время+TZ, email, справочники service_type.
Бизнес‑правила: взаимные зависимости, дубликаты, слоты (свободен/бронь TTL), лимиты.
Уверенность: на поле и на весь JSON; политика коммита: min_field_conf, min_overall_conf.
Контекст и RAG

Экстрактор учитывает:
Историю: “поменяй на завтра” → относительная дата.
Профиль из БД/CRM для префилла (name, phone, timezone).
RAG‑контекст для терминов/условий (например, маппинг тарифов → service_type).
Возвращает evidence (фрагменты текста), источник знания для трассировки.
Анти‑гонки и Идемпотентность

Upsert по conversation_id+form_code.
Версионирование черновика (draft_version), optimistic lock.
Коммиты имеют submission_id и ретраи с dedupe ключом.
Логи и Метрики

Лог patch’ей без PII (маскировка), токены, уверенности, причины отказа коммита.
Метрики: % автокоммитов, среднее время до полноты, доля исправлений, точность RAG.
Переменные Окружения (.env) — дополнение для CRM

```bash
# Экстрактор LLM (использовать существующую Google GenAI интеграцию)
GOOGLE_GENAI_API_KEY=your_api_key_here
EXTRACTOR_MODEL=gemini-1.5-pro

# Настройки автокоммита
AUTO_COMMIT=0
AUTO_COMMIT_MIN_CONF=0.85
FIELD_MIN_CONF=0.75

# Настройки экстракции
PATCH_MAX_AGE_SEC=3600
SCHEMA_VERSION=1.0
UPSERT_DEDUPE_WINDOW_SEC=300
AUDIT_LOG_LEVEL=info

# Интеграция с существующими сервисами
WHATSAPP_SESSION_PATH=./whatsapp-sessions
NOTIFICATION_WORKER_ENABLED=true
EXTRACTOR_WORKER_ENABLED=true

# Пороги уверенности для разных типов записей
LESSON_BOOKING_MIN_CONF=0.8
STUDENT_REGISTRATION_MIN_CONF=0.9
CONSULTATION_MIN_CONF=0.7
```
Пример Patch Формата для CRM

Input: "Привет, я Иван Петров. Хочу записать сына Максима на индивидуальное занятие завтра после 18:00. Мой телефон +7-999-123-45-67."
Patch:
```json
{
  "operations": [
    {
      "op": "set",
      "path": "/parentName",
      "value": "Иван Петров",
      "confidence": 0.98,
      "evidence": "я Иван Петров"
    },
    {
      "op": "set", 
      "path": "/studentName",
      "value": "Максим",
      "confidence": 0.95,
      "evidence": "сына Максима"
    },
    {
      "op": "set",
      "path": "/parentPhone", 
      "value": "+79991234567",
      "confidence": 0.99,
      "evidence": "+7-999-123-45-67"
    },
    {
      "op": "set",
      "path": "/lessonType",
      "value": "individual", 
      "confidence": 0.92,
      "evidence": "индивидуальное занятие"
    },
    {
      "op": "set",
      "path": "/preferredDate",
      "value": "2024-01-16T18:00:00Z",
      "confidence": 0.86,
      "evidence": "завтра после 18:00"
    }
  ],
  "overallConfidence": 0.94,
  "missingFields": ["studentAge", "teacherId"],
  "formType": "lesson_booking"
}
```
Бэклог (для старта работы другим агентом) - адаптировано под CRM проект

Архитектура и каркас (адаптировано под существующий проект CRM)

Интеграция в существующую Next.js архитектуру:
- Добавить новые API маршруты в src/app/api/extractor/:
  - POST /api/extractor/extract - извлечение данных из сообщения
  - POST /api/extractor/commit-candidate - коммит готового черновика
  - GET /api/extractor/drafts/[conversationId] - получение черновика
  - PUT /api/extractor/drafts/[conversationId] - обновление черновика

Расширение схемы БД (добавить в prisma/schema.prisma):

```prisma
// Черновики форм записи на занятия
model ConversationDraft {
  id              String   @id @default(cuid())
  conversationId  String   @unique // WhatsApp chat ID
  formType        String   // "lesson_booking", "student_registration", "consultation"
  draftData       Json     // Текущее состояние черновика
  isComplete      Boolean  @default(false)
  autoCommit      Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Связи
  versions        DraftVersion[]
  submissions     DraftSubmission[]
  messages        ConversationMessage[]
  
  @@map("conversation_drafts")
}

// Версионирование черновиков
model DraftVersion {
  id              Int      @id @default(autoincrement())
  draftId         String
  version         Int
  patchData       Json     // Patch операции
  confidence      Float    // Общая уверенность
  messageId       String?  // ID сообщения WhatsApp
  createdAt       DateTime @default(now())
  
  // Связи
  draft           ConversationDraft @relation(fields: [draftId], references: [id], onDelete: Cascade)
  
  @@unique([draftId, version])
  @@map("draft_versions")
}

// Коммиты черновиков
model DraftSubmission {
  id              String   @id @default(cuid())
  draftId         String
  submissionData  Json     // Финальные данные для коммита
  status          String   @default("pending") // pending, committed, failed
  errorMessage    String?
  createdAt       DateTime @default(now())
  
  // Связи
  draft           ConversationDraft @relation(fields: [draftId], references: [id], onDelete: Cascade)
  
  @@map("draft_submissions")
}

// Сообщения для экстракции
model ConversationMessage {
  id              String   @id @default(cuid())
  draftId         String
  messageId       String   // WhatsApp message ID
  content         String   // Текст сообщения
  senderType      String   // "user" или "bot"
  processedAt     DateTime @default(now())
  
  // Связи
  draft           ConversationDraft @relation(fields: [draftId], references: [id], onDelete: Cascade)
  
  @@map("conversation_messages")
}

// Логи экстракции
model ExtractorLog {
  id              Int      @id @default(autoincrement())
  draftId         String?
  messageId       String?
  operation       String   // "extract", "validate", "commit"
  inputData       Json?
  outputData      Json?
  confidence      Float?
  errorMessage    String?
  processingTime  Int?     // В миллисекундах
  createdAt       DateTime @default(now())
  
  @@map("extractor_logs")
}
```

Интеграция с существующими сервисами:
- Использовать существующую WhatsApp интеграцию (src/app/api/whatsapp/)
- Расширить notification-worker для обработки экстракции
- Интегрировать с существующей системой пользователей и учеников
JSON Schema и валидации (интеграция с CRM)

Примеры схем для CRM (src/lib/schemas/):

```typescript
// Схема для записи на занятие
export const lessonBookingSchema = {
  type: "object",
  required: ["studentName", "parentPhone", "preferredDate", "lessonType"],
  properties: {
    studentName: { type: "string", minLength: 2 },
    parentPhone: { type: "string", pattern: "^\\+7[0-9]{10}$" },
    parentName: { type: "string" },
    studentAge: { type: "integer", minimum: 1, maximum: 18 },
    preferredDate: { type: "string", format: "date-time" },
    preferredTime: { type: "string", pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$" },
    lessonType: { type: "string", enum: ["individual", "group", "consultation"] },
    teacherId: { type: "integer" },
    notes: { type: "string" },
    diagnosis: { type: "string" }
  }
};

// Схема для регистрации студента
export const studentRegistrationSchema = {
  type: "object", 
  required: ["fullName", "phone", "age", "parentName"],
  properties: {
    fullName: { type: "string", minLength: 2 },
    phone: { type: "string", pattern: "^\\+7[0-9]{10}$" },
    age: { type: "integer", minimum: 1, maximum: 18 },
    parentName: { type: "string", minLength: 2 },
    diagnosis: { type: "string" },
    comment: { type: "string" },
    userId: { type: "integer" }
  }
};
```

Интеграция с существующими типами:
- Использовать существующие типы Student, Lesson, User из src/types/index.ts
- Интегрировать с существующими валидаторами (src/lib/utils.ts)
- Нормализация: использовать существующие функции для телефонов и дат

Экстрактор (LLM) - интеграция с существующей AI системой
- Расширить существующий AI сервис (src/domain/services/AIService.ts)
- Использовать существующую интеграцию с Google GenAI (@google/genai)
- Создать ExtractorService в src/domain/services/
- Интегрировать с существующими use-cases в src/application/use-cases/

Интеграция с разговорной моделью

Расширение WhatsApp системы (src/app/api/whatsapp/route.ts):
```typescript
// Добавить обработку сообщений для экстракции
export async function POST(request: NextRequest) {
  const { action, phoneNumber, message, messageId } = await request.json();
  
  switch (action) {
    case 'process_message':
      // Обработка сообщения через экстрактор
      return await processMessageForExtraction(phoneNumber, message, messageId);
    case 'confirm_booking':
      // Подтверждение записи через WhatsApp
      return await confirmBooking(phoneNumber, messageId);
    // ... существующие действия
  }
}
```

Интеграция с notification-worker (src/lib/notification-worker.ts):
```typescript
// Добавить обработку экстракции в воркер
export class NotificationWorkerService {
  async processExtractionMessage(phoneNumber: string, message: string) {
    // 1. Получить или создать черновик
    // 2. Отправить на экстракцию
    // 3. Обновить черновик
    // 4. Проверить готовность к коммиту
    // 5. Отправить подтверждение или автокоммит
  }
}
```

Интеграция с компонентами форм (src/components/forms/):
- Расширить существующие формы для отображения данных из экстракции
- Добавить компоненты для подтверждения данных из WhatsApp
- Интегрировать с существующей системой валидации

Коммит и идемпотентность
- Использовать существующую Prisma ORM и транзакции
- Интегрировать с существующими API маршрутами для студентов и уроков
- Использовать существующую систему аутентификации (src/lib/auth.ts)

RAG для экстрактора
- Расширить существующую AI систему для контекстного поиска
- Использовать существующие данные студентов и уроков для контекста
- Интегрировать с существующими AI подсказками (AISuggestion модель)

Наблюдаемость и безопасность
- Использовать существующую систему логирования
- Интегрировать с существующими middleware (src/middleware.ts)
- Расширить существующую систему админки для мониторинга экстракции

Тестирование
- Использовать существующую тестовую инфраструктуру (tests/)
- Расширить существующие интеграционные тесты
- Использовать существующие фикстуры и утилиты тестирования

## Конкретные шаги реализации (приоритизированный бэклог)

### Этап 1: Базовая инфраструктура (1-2 недели)
1. **Создать миграцию БД** - добавить новые модели в prisma/schema.prisma
2. **Создать базовые API маршруты** - src/app/api/extractor/
3. **Создать базовые сервисы** - src/domain/services/ExtractorService.ts
4. **Создать JSON схемы** - src/lib/schemas/
5. **Настроить переменные окружения** - обновить .env

### Этап 2: Интеграция с AI (1 неделя)
1. **Расширить AI сервис** - добавить экстракцию в src/domain/services/AIService.ts
2. **Создать промпты для экстракции** - специализированные промпты для CRM
3. **Реализовать валидацию и нормализацию** - интеграция с существующими утилитами

### Этап 3: WhatsApp интеграция (1 неделя)
1. **Расширить WhatsApp API** - добавить обработку сообщений для экстракции
2. **Интегрировать с notification-worker** - добавить обработку экстракции
3. **Создать компоненты подтверждения** - UI для подтверждения данных

### Этап 4: Коммит и идемпотентность (1 неделя)
1. **Реализовать коммит логику** - интеграция с существующими API
2. **Добавить идемпотентность** - использование существующих транзакций
3. **Создать систему логирования** - расширить существующую систему логов

### Этап 5: Тестирование и мониторинг (1 неделя)
1. **Написать тесты** - юнит и интеграционные тесты
2. **Добавить мониторинг** - интеграция с админкой
3. **Создать документацию** - обновить README и API docs
Приёмочные Критерии (адаптировано под CRM)

Экстрактор стабильно выделяет данные записи на занятия из WhatsApp диалогов с conf ≥ порога.
Черновик обновляется идемпотентно; исправления пользователя перезаписывают значения.
Когда все required поля заполнены, сервис формирует кандидат на создание урока/студента; при AUTO_COMMIT=1 запись создаётся автоматически; при AUTO_COMMIT=0 — после подтверждения через WhatsApp.
Логи содержат patch, confidences, evidence; PII замаскированы; интеграция с существующей системой логирования.
Интеграция с существующими сущностями CRM: Student, Lesson, User, Payment.

Конкретные требования для CRM:
- Экстракция данных для записи на индивидуальные/групповые занятия
- Автоматическое создание студентов из WhatsApp диалогов
- Бронирование времени с проверкой конфликтов через существующую систему
- Интеграция с существующей системой оплат и балансов
- Использование существующих AI подсказок для рекомендаций занятий

Уточняющие Вопросы (адаптировано под CRM)

Когда разрешён автокоммит без подтверждения? Всегда при conf≥X или только для отдельных типов записей (консультации vs занятия)?
Какие поля обязательны для создания студента/урока в существующей схеме БД?
Как интегрироваться с существующей системой расписания и проверки конфликтов?
Использовать существующую Google GenAI интеграцию или добавить другой провайдер?
Как интегрироваться с существующими профилями студентов для префилла данных?
Использовать существующие статусы уроков (scheduled, prepaid, completed, paid) для идемпотентности?
Порог по уверенности по умолчанию и политика при конфликте значений (новее/выше conf)?