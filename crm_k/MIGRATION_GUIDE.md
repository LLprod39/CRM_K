# Руководство по миграции на чистую архитектуру

## Обзор изменений

Проект был реорганизован согласно принципам чистой архитектуры. Основные изменения:

1. **Новая структура папок** - код разделен на слои (domain, application, infrastructure, presentation, shared)
2. **Разделение ответственности** - каждый слой имеет четко определенную роль
3. **Интерфейсы и абстракции** - использование интерфейсов для развязки слоев
4. **Use Cases** - бизнес-логика вынесена в отдельные сценарии использования

## Что было изменено

### 1. Структура папок

**Было:**
```
src/
├── components/
├── contexts/
├── hooks/
├── lib/
├── types/
└── app/
```

**Стало:**
```
src/
├── domain/           # Бизнес-логика
├── application/      # Use Cases
├── infrastructure/   # Технические детали
├── presentation/     # UI слой
├── shared/          # Общие утилиты
└── app/             # Next.js App Router
```

### 2. Перемещенные файлы

- `src/types/index.ts` → `src/shared/types/index.ts`
- `src/lib/db.ts` → `src/infrastructure/database/db.ts`
- `src/lib/utils.ts` → `src/shared/utils/index.ts`
- `src/contexts/` → `src/presentation/contexts/`
- `src/hooks/` → `src/presentation/hooks/`

### 3. Новые файлы

#### Domain Layer
- `src/domain/entities/` - Сущности домена
- `src/domain/repositories/` - Интерфейсы репозиториев
- `src/domain/services/` - Доменные сервисы

#### Application Layer
- `src/application/use-cases/` - Сценарии использования
- `src/application/dto/` - Data Transfer Objects

#### Infrastructure Layer
- `src/infrastructure/repositories/` - Реализации репозиториев

## Обновление импортов

### 1. Обновленные импорты в layout.tsx

**Было:**
```typescript
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
```

**Стало:**
```typescript
import { AuthProvider, ToastProvider } from "@/presentation/contexts";
```

### 2. Обновление импортов типов

**Было:**
```typescript
import { Student, Lesson } from "@/types";
```

**Стало:**
```typescript
import { Student, Lesson } from "@/domain/entities";
// или
import { Student, Lesson } from "@/shared/types"; // для общих типов
```

### 3. Обновление импортов утилит

**Было:**
```typescript
import { cn } from "@/lib/utils";
```

**Стало:**
```typescript
import { cn } from "@/shared/utils";
```

### 4. Обновление импортов базы данных

**Было:**
```typescript
import { prisma } from "@/lib/db";
```

**Стало:**
```typescript
import { prisma } from "@/infrastructure/database";
```

## Пошаговая миграция

### Шаг 1: Обновление импортов в компонентах

Найдите все файлы с импортами из старых путей и обновите их:

```bash
# Поиск файлов с импортами из @/types
grep -r "from \"@/types\"" src/

# Поиск файлов с импортами из @/lib
grep -r "from \"@/lib\"" src/

# Поиск файлов с импортами из @/contexts
grep -r "from \"@/contexts\"" src/

# Поиск файлов с импортами из @/hooks
grep -r "from \"@/hooks\"" src/
```

### Шаг 2: Обновление API маршрутов

В API маршрутах обновите импорты:

**Было:**
```typescript
import { prisma } from "@/lib/db";
import { Student } from "@/types";
```

**Стало:**
```typescript
import { prisma } from "@/infrastructure/database";
import { Student } from "@/domain/entities";
```

### Шаг 3: Обновление компонентов

В React компонентах обновите импорты:

**Было:**
```typescript
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { Student } from "@/types";
```

**Стало:**
```typescript
import { useAuth } from "@/presentation/contexts";
import { useToast } from "@/presentation/hooks";
import { Student } from "@/domain/entities";
```

### Шаг 4: Обновление утилит

**Было:**
```typescript
import { cn, formatDate } from "@/lib/utils";
```

**Стало:**
```typescript
import { cn, formatDate } from "@/shared/utils";
```

## Проверка миграции

### 1. Проверка компиляции

```bash
npm run build
```

### 2. Проверка линтера

```bash
npm run lint
```

### 3. Проверка типов

```bash
npx tsc --noEmit
```

### 4. Тестирование

```bash
npm test
```

## Возможные проблемы и решения

### 1. Ошибки импортов

**Проблема:** Модуль не найден
**Решение:** Проверьте правильность пути импорта

### 2. Циклические зависимости

**Проблема:** Циклические импорты между модулями
**Решение:** Используйте интерфейсы и инверсию зависимостей

### 3. Отсутствующие типы

**Проблема:** TypeScript не может найти типы
**Решение:** Убедитесь, что типы экспортированы из правильных модулей

## Рекомендации

### 1. Постепенная миграция

- Мигрируйте по одному файлу за раз
- Тестируйте после каждого изменения
- Используйте git для отслеживания изменений

### 2. Использование новых паттернов

- Используйте Use Cases для бизнес-логики
- Применяйте интерфейсы для развязки слоев
- Следуйте принципам SOLID

### 3. Документирование

- Обновляйте документацию при изменениях
- Комментируйте сложную логику
- Ведите changelog

## Дополнительные ресурсы

- [Clean Architecture - Robert Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection)

## Поддержка

При возникновении проблем:

1. Проверьте документацию архитектуры
2. Изучите примеры в коде
3. Обратитесь к команде разработки
