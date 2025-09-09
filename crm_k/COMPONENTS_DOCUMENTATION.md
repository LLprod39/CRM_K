# Документация компонентов CRM_K

## Обзор

CRM_K построен на React с использованием Next.js 15 и TypeScript. Все компоненты следуют принципам компонентной архитектуры и переиспользования.

## Структура компонентов

```
src/components/
├── ui/                    # Базовые UI компоненты
│   ├── Navigation.tsx     # Навигация
│   ├── Calendar.tsx       # Календарь занятий
│   └── LessonFilters.tsx  # Фильтры занятий
├── forms/                 # Формы
│   ├── AddStudentForm.tsx # Форма добавления ученика
│   ├── EditStudentForm.tsx# Форма редактирования ученика
│   ├── AddLessonForm.tsx  # Форма добавления занятия
│   └── EditLessonForm.tsx # Форма редактирования занятия
├── tables/                # Таблицы
│   └── LessonsList.tsx    # Список занятий
├── finances/              # Финансовые компоненты
│   ├── FinancialStats.tsx # Финансовая статистика
│   ├── RevenueChart.tsx   # График доходов
│   ├── DebtsList.tsx      # Список задолженностей
│   ├── TopStudents.tsx    # Топ учеников
│   └── PeriodFilters.tsx  # Фильтры периодов
├── ErrorBoundary.tsx      # Обработка ошибок
└── ErrorHandler.tsx       # Обработчик ошибок
```

## UI Компоненты

### Navigation.tsx

Основной компонент навигации приложения.

**Props:**
- Нет

**Использование:**
```tsx
import Navigation from '@/components/ui/Navigation';

<Navigation />
```

**Особенности:**
- Адаптивная навигация
- Активные состояния ссылок
- Иконки для каждого раздела

### Calendar.tsx

Интерактивный календарь для отображения занятий.

**Props:**
```typescript
interface CalendarProps {
  lessons: LessonWithOptionalStudent[];
  onLessonClick: (lesson: LessonWithOptionalStudent) => void;
  onDateClick: (date: Date) => void;
  currentDate?: Date;
}
```

**Использование:**
```tsx
import Calendar from '@/components/ui/Calendar';

<Calendar
  lessons={lessons}
  onLessonClick={handleLessonClick}
  onDateClick={handleDateClick}
  currentDate={selectedDate}
/>
```

**Особенности:**
- Месячный вид календаря
- Цветовая индикация статусов занятий
- Навигация по месяцам
- Клик по дате для добавления занятий

### LessonFilters.tsx

Компонент фильтрации занятий.

**Props:**
```typescript
interface LessonFiltersProps {
  onFiltersChange: (filters: {
    dateFrom: string;
    dateTo: string;
    studentId: string;
    status: string;
    period: 'today' | 'week' | 'month' | 'all';
  }) => void;
  selectedDate?: Date;
}
```

**Использование:**
```tsx
import LessonFilters from '@/components/ui/LessonFilters';

<LessonFilters
  onFiltersChange={handleFiltersChange}
  selectedDate={selectedDate}
/>
```

**Особенности:**
- Фильтрация по дате, ученику, статусу
- Предустановленные периоды
- Сброс фильтров

## Формы

### AddStudentForm.tsx

Форма для добавления нового ученика.

**Props:**
```typescript
interface AddStudentFormProps {
  onSuccess: () => void;
  onClose: () => void;
}
```

**Использование:**
```tsx
import AddStudentForm from '@/components/forms/AddStudentForm';

<AddStudentForm
  onSuccess={handleSuccess}
  onClose={handleClose}
/>
```

**Особенности:**
- Валидация полей
- Обработка ошибок
- Анимации загрузки

### EditStudentForm.tsx

Форма для редактирования существующего ученика.

**Props:**
```typescript
interface EditStudentFormProps {
  student: Student;
  onSuccess: () => void;
  onClose: () => void;
}
```

### AddLessonForm.tsx

Форма для добавления нового занятия.

**Props:**
```typescript
interface AddLessonFormProps {
  onSuccess: () => void;
  onClose: () => void;
  selectedDate?: Date;
}
```

### EditLessonForm.tsx

Форма для редактирования существующего занятия.

**Props:**
```typescript
interface EditLessonFormProps {
  lesson: LessonWithOptionalStudent;
  onSuccess: () => void;
  onClose: () => void;
}
```

## Таблицы

### LessonsList.tsx

Таблица для отображения списка занятий.

**Props:**
```typescript
interface LessonsListProps {
  lessons: LessonWithOptionalStudent[];
  onLessonClick: (lesson: LessonWithOptionalStudent) => void;
  onEditLesson: (lesson: LessonWithOptionalStudent) => void;
  selectedDate?: Date;
}
```

**Особенности:**
- Адаптивный дизайн
- Сортировка по дате
- Действия с занятиями
- Статусы занятий

## Финансовые компоненты

### FinancialStats.tsx

Компонент финансовой статистики.

**Props:**
```typescript
interface FinancialStatsProps {
  period: string;
  onPeriodChange?: (period: string) => void;
}
```

**Особенности:**
- Карточки статистики
- Графики доходов
- Топ учеников
- Задолженности

### RevenueChart.tsx

График доходов по периодам.

**Props:**
```typescript
interface RevenueChartProps {
  period: string;
}
```

**Особенности:**
- Интерактивные графики
- Различные типы диаграмм
- Адаптивный дизайн

### DebtsList.tsx

Список задолженностей учеников.

**Особенности:**
- Группировка по ученикам
- Сумма задолженности
- История платежей

### TopStudents.tsx

Рейтинг учеников по оплатам.

**Особенности:**
- Сортировка по сумме оплат
- Количество занятий
- Средний чек

### PeriodFilters.tsx

Фильтры для выбора периода отчетности.

**Props:**
```typescript
interface PeriodFiltersProps {
  onPeriodChange: (period: string) => void;
  selectedPeriod: string;
}
```

## Обработка ошибок

### ErrorBoundary.tsx

Глобальный обработчик ошибок React.

**Props:**
```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}
```

**Использование:**
```tsx
import ErrorBoundary from '@/components/ErrorBoundary';

<ErrorBoundary>
  <App />
</ErrorBoundary>
```

**Особенности:**
- Перехват JavaScript ошибок
- Красивый UI для ошибок
- Возможность сброса ошибки
- Детали ошибки в dev режиме

### ErrorHandler.tsx

Компонент для отображения уведомлений об ошибках.

**Props:**
```typescript
interface ErrorHandlerProps {
  error: string | null;
  onDismiss: () => void;
}
```

**Хук useErrorHandler:**
```typescript
const { error, handleError, clearError } = useErrorHandler();
```

**Утилита handleApiError:**
```typescript
try {
  const response = await fetch('/api/students');
  if (!response.ok) {
    throw await handleApiError(response);
  }
} catch (error) {
  handleError(error);
}
```

## Стилизация

### Tailwind CSS

Все компоненты используют Tailwind CSS для стилизации:

```tsx
<div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  <h2 className="text-xl font-semibold text-gray-900 mb-4">
    Заголовок
  </h2>
  <p className="text-gray-600">
    Описание
  </p>
</div>
```

### Анимации

Используются CSS анимации для улучшения UX:

```css
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

.animate-slide-in {
  animation: slideIn 0.3s ease-out;
}

.animate-scale-in {
  animation: scaleIn 0.2s ease-out;
}
```

### Адаптивность

Все компоненты адаптивны и работают на мобильных устройствах:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Контент */}
</div>
```

## Типы данных

### Основные типы

```typescript
// Ученик
interface Student {
  id: number;
  fullName: string;
  phone: string;
  age: number;
  diagnosis?: string | null;
  comment?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Занятие
interface Lesson {
  id: number;
  date: Date;
  studentId: number;
  cost: number;
  status: LessonStatus;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Статусы занятий
type LessonStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'PAID';
```

### Расширенные типы

```typescript
// Урок с включенным студентом
type LessonWithStudent = Lesson & {
  student: Student;
};

// Урок с опциональным студентом
type LessonWithOptionalStudent = Lesson & {
  student?: Student;
};

// Студент с включенными уроками
type StudentWithLessons = Student & {
  lessons: Lesson[];
};
```

## Лучшие практики

### 1. Компонентная архитектура
- Разделение ответственности
- Переиспользование компонентов
- Единообразный API

### 2. TypeScript
- Строгая типизация
- Интерфейсы для props
- Типы для данных

### 3. Обработка ошибок
- Error boundaries
- Graceful degradation
- Пользовательские сообщения

### 4. Производительность
- React.memo для оптимизации
- useMemo для вычислений
- useCallback для функций

### 5. Доступность
- Семантическая разметка
- ARIA атрибуты
- Клавиатурная навигация

## Тестирование

### Unit тесты
```typescript
import { render, screen } from '@testing-library/react';
import AddStudentForm from '@/components/forms/AddStudentForm';

test('renders add student form', () => {
  render(<AddStudentForm onSuccess={jest.fn()} onClose={jest.fn()} />);
  expect(screen.getByText('Добавить ученика')).toBeInTheDocument();
});
```

### Integration тесты
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.post('/api/students', (req, res, ctx) => {
    return res(ctx.json({ id: 1, fullName: 'Test Student' }));
  })
);
```

## Развертывание

### Сборка
```bash
npm run build
```

### Запуск в продакшене
```bash
npm start
```

### Переменные окружения
```env
DATABASE_URL="file:./dev.db"
NODE_ENV="production"
```
