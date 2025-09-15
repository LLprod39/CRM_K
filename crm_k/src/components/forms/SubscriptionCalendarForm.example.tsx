'use client';

import { useState } from 'react';
import { CalendarDays, Plus } from 'lucide-react';
import SubscriptionCalendarForm from './SubscriptionCalendarForm';

/**
 * Пример использования компонента SubscriptionCalendarForm
 * Этот файл показывает, как интегрировать компонент в существующие формы
 */

export default function SubscriptionCalendarFormExample() {
  const [isSubscriptionFormOpen, setIsSubscriptionFormOpen] = useState(false);

  const handleSubscriptionSuccess = () => {
    console.log('Абонимент успешно создан!');
    // Здесь можно обновить данные календаря, показать уведомление и т.д.
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Пример интеграции SubscriptionCalendarForm
      </h1>

      {/* Кнопка для открытия формы абонимента */}
      <div className="mb-6">
        <button
          onClick={() => setIsSubscriptionFormOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <CalendarDays className="w-5 h-5 mr-2" />
          Создать абонимент
        </button>
      </div>

      {/* Инструкции по использованию */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">
          Как использовать компонент:
        </h2>
        <ul className="text-blue-800 space-y-1">
          <li>• Импортируйте компонент: <code>import SubscriptionCalendarForm from './SubscriptionCalendarForm'</code></li>
          <li>• Добавьте состояние для управления открытием/закрытием формы</li>
          <li>• Передайте необходимые пропсы: isOpen, onClose, onSuccess</li>
          <li>• Обработайте успешное создание занятий в функции onSuccess</li>
        </ul>
      </div>

      {/* Код интеграции */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Код интеграции:
        </h3>
        <pre className="text-sm text-gray-700 overflow-x-auto">
{`import { useState } from 'react';
import SubscriptionCalendarForm from './SubscriptionCalendarForm';

export default function YourComponent() {
  const [isSubscriptionFormOpen, setIsSubscriptionFormOpen] = useState(false);

  const handleSubscriptionSuccess = () => {
    // Обновить данные календаря
    // Показать уведомление об успехе
    // Закрыть форму
  };

  return (
    <>
      {/* Ваша кнопка для открытия формы */}
      <button onClick={() => setIsSubscriptionFormOpen(true)}>
        Создать абонимент
      </button>

      {/* Форма абонимента */}
      <SubscriptionCalendarForm
        isOpen={isSubscriptionFormOpen}
        onClose={() => setIsSubscriptionFormOpen(false)}
        onSuccess={handleSubscriptionSuccess}
      />
    </>
  );
}`}
        </pre>
      </div>

      {/* Компонент формы абонимента */}
      <SubscriptionCalendarForm
        isOpen={isSubscriptionFormOpen}
        onClose={() => setIsSubscriptionFormOpen(false)}
        onSuccess={handleSubscriptionSuccess}
      />
    </div>
  );
}
