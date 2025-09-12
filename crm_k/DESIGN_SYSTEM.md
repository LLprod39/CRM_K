# Дизайн-система CRM

## Обзор

Эта дизайн-система обеспечивает единообразный внешний вид и поведение всех компонентов в приложении CRM. Все компоненты следуют единым принципам дизайна для создания современного и удобного интерфейса.

## Основные принципы

### 1. Цветовая палитра

```css
/* Основные цвета */
--primary: #3b82f6 (синий)
--secondary: #f8fafc (светло-серый)
--success: #10b981 (зеленый)
--warning: #f59e0b (оранжевый)
--danger: #ef4444 (красный)
--info: #06b6d4 (голубой)

/* Градации серого */
--gray-50: #f9fafb
--gray-100: #f3f4f6
--gray-200: #e5e7eb
--gray-300: #d1d5db
--gray-400: #9ca3af
--gray-500: #6b7280
--gray-600: #4b5563
--gray-700: #374151
--gray-800: #1f2937
--gray-900: #111827
```

### 2. Скругления

- `rounded-xl` (0.75rem) - основное скругление для карточек и модальных окон
- `rounded-lg` (0.5rem) - для кнопок и небольших элементов
- `rounded-full` - для аватаров и статусных индикаторов

### 3. Тени

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
--shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1)
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1)
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1)
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1)
```

### 4. Отступы

- `p-4` (1rem) - малые отступы
- `p-6` (1.5rem) - стандартные отступы
- `p-8` (2rem) - большие отступы

## Компоненты

### Modal (Модальные окна)

```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Заголовок"
  size="lg" // sm | md | lg | xl | full
  footer={<ModalFooter ... />}
>
  <ModalSection icon={<Icon />} title="Секция">
    Контент
  </ModalSection>
</Modal>
```

**Особенности:**
- Единый фон: `bg-black/60 backdrop-blur-sm`
- Анимация появления: `animate-scale-in`
- Заголовок с градиентным фоном
- Поддержка вложенных секций

### Card (Карточки)

```tsx
<Card 
  variant="default" // default | elevated | flat | bordered
  padding="md" // none | sm | md | lg
  hover={true}
>
  <CardHeader icon={<Icon />} action={<Button />}>
    <CardTitle subtitle="Подзаголовок">
      Заголовок
    </CardTitle>
  </CardHeader>
  <CardContent>
    Контент
  </CardContent>
</Card>
```

**Варианты:**
- `default`: белый фон с легкой тенью и границей
- `elevated`: белый фон с выраженной тенью
- `flat`: серый фон без тени
- `bordered`: белый фон с выраженной границей

### Button (Кнопки)

```tsx
<Button 
  variant="primary" // primary | secondary | danger | ghost | success
  size="md" // sm | md | lg
  loading={false}
  icon={<Icon />}
>
  Текст кнопки
</Button>
```

**Стили:**
- Все кнопки имеют `rounded-xl` скругление
- Градиентный фон для primary, danger, success
- Анимация при наведении и клике

### Input (Поля ввода)

```tsx
<Input
  label="Метка"
  error="Ошибка"
  icon={<Icon />}
  iconPosition="left" // left | right
  variant="default" // default | filled | outline
  size="md" // sm | md | lg
/>
```

**Особенности:**
- Скругление `rounded-xl`
- Фокус с синей обводкой
- Поддержка иконок и ошибок

### Таблицы и списки

**Стили для таблиц:**
- Заголовок с иконкой и подзаголовком
- Разделители `divide-gray-100`
- Hover эффект для строк
- Скругленные кнопки действий

**Пример:**
```tsx
<Card padding="none">
  <CardHeader icon={<Calendar />}>
    <CardTitle subtitle="Найдено: 10">
      Занятия
    </CardTitle>
  </CardHeader>
  <div className="divide-y divide-gray-100">
    {items.map(item => (
      <div className="p-6 hover:bg-gray-50 transition-all duration-200">
        {/* Контент */}
      </div>
    ))}
  </div>
</Card>
```

### Статусы и бейджи

```tsx
<span className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
  Статус
</span>
```

**Цветовые схемы:**
- Синий: запланировано
- Зеленый: завершено
- Желтый: предоплачено
- Оранжевый: не оплачено
- Красный: отменено
- Фиолетовый: завершено и оплачено

## Анимации

### Базовые анимации

```css
/* Плавное появление */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

/* Масштабирование */
.animate-scale-in {
  animation: scaleIn 0.2s ease-out;
}

/* Слайд справа */
.animate-slide-in-right {
  animation: slideInRight 0.3s ease-out;
}
```

### Переходы

Все интерактивные элементы используют:
```css
transition-all duration-200
```

## Адаптивность

### Breakpoints

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Мобильные оптимизации

- Минимальная высота кнопок: 44px
- Размер шрифта в полях ввода: 16px (предотвращает зум)
- Поддержка touch-событий
- Оптимизированная прокрутка

## Использование

### Импорт компонентов

```tsx
import Modal, { ModalSection, ModalFooter } from '@/components/ui/Modal';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
```

### Примеры использования

**Модальное окно с формой:**
```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Добавить занятие"
  footer={
    <ModalFooter
      onCancel={onClose}
      onConfirm={handleSubmit}
      confirmText="Добавить"
      loading={loading}
    />
  }
>
  <ModalSection icon={<User />} title="Информация об ученике">
    <Input label="Имя" value={name} onChange={setName} />
  </ModalSection>
</Modal>
```

**Карточка со списком:**
```tsx
<Card>
  <CardHeader icon={<Calendar />}>
    <CardTitle subtitle="10 занятий">
      Расписание на неделю
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* Список занятий */}
  </CardContent>
</Card>
```

## Лучшие практики

1. **Используйте семантические цвета** - primary для основных действий, danger для удаления и т.д.
2. **Сохраняйте консистентность** - используйте одинаковые отступы и размеры для похожих элементов
3. **Добавляйте hover-эффекты** - все интерактивные элементы должны реагировать на наведение
4. **Оптимизируйте для мобильных** - проверяйте работу на маленьких экранах
5. **Используйте анимации умеренно** - только для улучшения UX, не для украшения

## Обновления

При добавлении новых компонентов следуйте этим принципам:
- Скругления: `rounded-xl` для контейнеров, `rounded-lg` для элементов
- Тени: используйте предопределенные классы shadow-*
- Цвета: используйте переменные из палитры
- Анимации: добавляйте transition-all duration-200
