# API Документация CRM_K

## Обзор

CRM_K предоставляет RESTful API для управления учениками, занятиями и финансовой отчетностью. Все API endpoints возвращают JSON данные.

## Базовый URL

```
http://localhost:3000/api
```

## Аутентификация

В текущей версии аутентификация не требуется. Все endpoints доступны без токенов.

## Общие заголовки

```
Content-Type: application/json
```

## Коды ответов

- `200` - Успешный запрос
- `201` - Ресурс создан
- `400` - Неверные данные запроса
- `404` - Ресурс не найден
- `500` - Внутренняя ошибка сервера

## Endpoints

### Ученики

#### GET /api/students
Получить список всех учеников

**Ответ:**
```json
[
  {
    "id": 1,
    "fullName": "Иванов Иван Иванович",
    "phone": "+7 (999) 123-45-67",
    "age": 10,
    "diagnosis": "ДЦП",
    "comment": "Требует особого внимания",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "lessons": [
      {
        "id": 1,
        "date": "2024-01-15T10:00:00.000Z",
        "cost": 1500,
        "status": "SCHEDULED",
        "notes": "Первое занятие"
      }
    ]
  }
]
```

#### POST /api/students
Создать нового ученика

**Тело запроса:**
```json
{
  "fullName": "Петров Петр Петрович",
  "phone": "+7 (999) 987-65-43",
  "age": 12,
  "diagnosis": "Аутизм",
  "comment": "Очень активный ребенок"
}
```

**Ответ:**
```json
{
  "id": 2,
  "fullName": "Петров Петр Петрович",
  "phone": "+7 (999) 987-65-43",
  "age": 12,
  "diagnosis": "Аутизм",
  "comment": "Очень активный ребенок",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### GET /api/students/[id]
Получить ученика по ID

**Параметры:**
- `id` (number) - ID ученика

**Ответ:**
```json
{
  "id": 1,
  "fullName": "Иванов Иван Иванович",
  "phone": "+7 (999) 123-45-67",
  "age": 10,
  "diagnosis": "ДЦП",
  "comment": "Требует особого внимания",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "lessons": [...]
}
```

#### PUT /api/students/[id]
Обновить данные ученика

**Параметры:**
- `id` (number) - ID ученика

**Тело запроса:**
```json
{
  "fullName": "Иванов Иван Иванович",
  "phone": "+7 (999) 123-45-67",
  "age": 11,
  "diagnosis": "ДЦП",
  "comment": "Обновленный комментарий"
}
```

#### DELETE /api/students/[id]
Удалить ученика

**Параметры:**
- `id` (number) - ID ученика

**Ответ:**
```json
{
  "message": "Ученик успешно удален"
}
```

### Занятия

#### GET /api/lessons
Получить список занятий

**Параметры запроса:**
- `studentId` (number, optional) - Фильтр по ученику
- `status` (string, optional) - Фильтр по статусу (SCHEDULED, COMPLETED, CANCELLED, PAID)
- `dateFrom` (string, optional) - Начальная дата (ISO string)
- `dateTo` (string, optional) - Конечная дата (ISO string)

**Ответ:**
```json
[
  {
    "id": 1,
    "date": "2024-01-15T10:00:00.000Z",
    "studentId": 1,
    "cost": 1500,
    "status": "SCHEDULED",
    "notes": "Первое занятие",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "student": {
      "id": 1,
      "fullName": "Иванов Иван Иванович",
      "phone": "+7 (999) 123-45-67",
      "age": 10
    }
  }
]
```

#### POST /api/lessons
Создать новое занятие

**Тело запроса:**
```json
{
  "date": "2024-01-20T14:00:00.000Z",
  "studentId": 1,
  "cost": 1500,
  "status": "SCHEDULED",
  "notes": "Повторное занятие"
}
```

#### GET /api/lessons/[id]
Получить занятие по ID

**Параметры:**
- `id` (number) - ID занятия

#### PUT /api/lessons/[id]
Обновить занятие

**Параметры:**
- `id` (number) - ID занятия

**Тело запроса:**
```json
{
  "date": "2024-01-20T15:00:00.000Z",
  "studentId": 1,
  "cost": 1500,
  "status": "COMPLETED",
  "notes": "Занятие проведено успешно"
}
```

#### DELETE /api/lessons/[id]
Удалить занятие

**Параметры:**
- `id` (number) - ID занятия

### Финансы

#### GET /api/finances/stats
Получить финансовую статистику

**Параметры запроса:**
- `period` (string, optional) - Период (day, week, month, year, all)

**Ответ:**
```json
{
  "totalRevenue": 45000,
  "monthlyRevenue": 15000,
  "weeklyRevenue": 3000,
  "dailyRevenue": 500,
  "completedLessons": 25,
  "totalDebt": 5000,
  "topStudents": [
    {
      "student": {
        "id": 1,
        "fullName": "Иванов Иван Иванович"
      },
      "totalPaid": 15000,
      "lessonsCount": 10
    }
  ],
  "statusStats": [
    {
      "status": "PAID",
      "count": 20,
      "totalCost": 30000
    }
  ]
}
```

#### GET /api/finances/debts
Получить список задолженностей

**Ответ:**
```json
[
  {
    "student": {
      "id": 1,
      "fullName": "Иванов Иван Иванович"
    },
    "totalDebt": 3000,
    "unpaidLessons": 2,
    "lastPaymentDate": "2024-01-10T00:00:00.000Z"
  }
]
```

#### GET /api/finances/period
Получить статистику за период

**Параметры запроса:**
- `period` (string, optional) - Период (day, week, month, year)
- `startDate` (string, optional) - Начальная дата (ISO string)
- `endDate` (string, optional) - Конечная дата (ISO string)

**Ответ:**
```json
{
  "period": "month",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-01-31T23:59:59.999Z",
  "revenue": 15000,
  "lessonsCount": 10,
  "averageCheck": 1500
}
```

#### GET /api/finances/students/[id]
Получить финансовый отчет по ученику

**Параметры:**
- `id` (number) - ID ученика

**Ответ:**
```json
{
  "student": {
    "id": 1,
    "fullName": "Иванов Иван Иванович"
  },
  "totalPaid": 15000,
  "totalDebt": 3000,
  "lessonsCompleted": 12,
  "lessonsPaid": 10,
  "averageCheck": 1500,
  "lastPaymentDate": "2024-01-10T00:00:00.000Z",
  "paymentHistory": [
    {
      "date": "2024-01-10T00:00:00.000Z",
      "amount": 1500,
      "lessonId": 5
    }
  ]
}
```

#### GET /api/finances/export
Экспорт финансовых данных

**Параметры запроса:**
- `format` (string, optional) - Формат экспорта (excel, csv)
- `period` (string, optional) - Период
- `startDate` (string, optional) - Начальная дата
- `endDate` (string, optional) - Конечная дата

**Ответ:** Файл в указанном формате

## Статусы занятий

- `SCHEDULED` - Запланировано
- `COMPLETED` - Проведено
- `CANCELLED` - Отменено
- `PAID` - Оплачено

## Обработка ошибок

Все ошибки возвращаются в следующем формате:

```json
{
  "error": "Описание ошибки"
}
```

### Примеры ошибок

**400 Bad Request:**
```json
{
  "error": "Необходимо заполнить все обязательные поля"
}
```

**404 Not Found:**
```json
{
  "error": "Ученик не найден"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Не удалось получить список учеников"
}
```

## Примеры использования

### JavaScript/TypeScript

```typescript
// Получить всех учеников
const students = await fetch('/api/students')
  .then(res => res.json());

// Создать нового ученика
const newStudent = await fetch('/api/students', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    fullName: 'Новый ученик',
    phone: '+7 (999) 000-00-00',
    age: 8,
    diagnosis: 'ЗПР'
  })
}).then(res => res.json());

// Получить занятия за месяц
const lessons = await fetch('/api/lessons?dateFrom=2024-01-01&dateTo=2024-01-31')
  .then(res => res.json());

// Получить финансовую статистику
const stats = await fetch('/api/finances/stats?period=month')
  .then(res => res.json());
```

### cURL

```bash
# Получить всех учеников
curl -X GET http://localhost:3000/api/students

# Создать нового ученика
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Новый ученик",
    "phone": "+7 (999) 000-00-00",
    "age": 8,
    "diagnosis": "ЗПР"
  }'

# Получить занятия за период
curl -X GET "http://localhost:3000/api/lessons?dateFrom=2024-01-01&dateTo=2024-01-31"
```

## Лимиты и ограничения

- Максимальный размер запроса: 1MB
- Максимальное количество записей в ответе: 1000
- Таймаут запроса: 30 секунд

## Версионирование

Текущая версия API: v1

В будущих версиях может быть добавлена поддержка версионирования через заголовок `API-Version`.
