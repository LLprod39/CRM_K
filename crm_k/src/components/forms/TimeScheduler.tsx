'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Plus, Minus, MapPin, DollarSign, FileText } from 'lucide-react';

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  cost: number;
  paymentStatus: 'PAID' | 'UNPAID';
  notes: string;
}

interface TimeSchedulerProps {
  selectedDays: string[];
  timeSlots: Record<string, TimeSlot[]>; // Ключ - дата в формате 'YYYY-MM-DD'
  onTimeSlotsChange: (timeSlots: Record<string, TimeSlot[]>) => void;
  className?: string;
}

const DAY_NAMES = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'PAID', label: 'Предоплачено' },
  { value: 'UNPAID', label: 'Запланировано' }
];

export default function TimeScheduler({
  selectedDays,
  timeSlots,
  onTimeSlotsChange,
  className = ''
}: TimeSchedulerProps) {
  // Инициализируем пустые слоты для новых дней
  useEffect(() => {
    const newTimeSlots = { ...timeSlots };
    let hasChanges = false;

    selectedDays.forEach(date => {
      if (!newTimeSlots[date]) {
        // Создаем один слот по умолчанию для каждого дня
        newTimeSlots[date] = [{
          id: `${date}-${Date.now()}-${Math.random()}`,
          startTime: '10:00',
          endTime: '11:00',
          cost: 1000,
          paymentStatus: 'UNPAID',
          notes: ''
        }];
        hasChanges = true;
      }
    });

    // Удаляем слоты для дней, которые больше не выбраны
    Object.keys(newTimeSlots).forEach(date => {
      if (!selectedDays.includes(date)) {
        delete newTimeSlots[date];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      onTimeSlotsChange(newTimeSlots);
    }
  }, [selectedDays, timeSlots, onTimeSlotsChange]);

  const addTimeSlot = (date: string) => {
    const newSlot: TimeSlot = {
      id: `${date}-${Date.now()}-${Math.random()}`,
      startTime: '10:00',
      endTime: '11:00',
      cost: 1000,
      paymentStatus: 'UNPAID',
      notes: ''
    };

    const newTimeSlots = {
      ...timeSlots,
      [date]: [...(timeSlots[date] || []), newSlot]
    };

    onTimeSlotsChange(newTimeSlots);
  };

  const removeTimeSlot = (date: string, slotId: string) => {
    const newTimeSlots = {
      ...timeSlots,
      [date]: (timeSlots[date] || []).filter(slot => slot.id !== slotId)
    };

    onTimeSlotsChange(newTimeSlots);
  };

  const updateTimeSlot = (date: string, slotId: string, field: keyof TimeSlot, value: any) => {
    const newTimeSlots = {
      ...timeSlots,
      [date]: (timeSlots[date] || []).map(slot =>
        slot.id === slotId ? { ...slot, [field]: value } : slot
      )
    };

    onTimeSlotsChange(newTimeSlots);
  };


  const calculateTotalCost = () => {
    return Object.values(timeSlots).reduce((total, slots) => {
      return total + slots.reduce((dayTotal, slot) => dayTotal + slot.cost, 0);
    }, 0);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayName = DAY_NAMES[date.getDay()];
    const dayNumber = date.getDate();
    const month = date.getMonth() + 1;
    return `${dayName}, ${dayNumber}.${month}`;
  };

  if (selectedDays.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg p-6 text-center ${className}`}>
        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">Сначала выберите дни занятий в календаре</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Заголовок */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Настройка времени занятий
          </h3>
        </div>
        {calculateTotalCost() > 0 && (
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-lg font-bold text-green-700">
              {calculateTotalCost().toLocaleString()} ₸
            </span>
          </div>
        )}
      </div>

      {/* Список дней */}
      <div className="divide-y divide-gray-200">
        {selectedDays.map(date => {
          const slots = timeSlots[date] || [];
          const dayTotalCost = slots.reduce((total, slot) => total + slot.cost, 0);

          return (
            <div key={date} className="p-4">
              {/* Заголовок дня */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{formatDate(date)}</span>
                  {dayTotalCost > 0 && (
                    <span className="text-sm text-green-600 font-medium">
                      {dayTotalCost.toLocaleString()} ₸
                    </span>
                  )}
                </div>
                <button
                  onClick={() => addTimeSlot(date)}
                  className="flex items-center px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Добавить занятие
                </button>
              </div>

              {/* Слоты времени */}
              <div className="space-y-3">
                {slots.map(slot => (
                  <div key={slot.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {/* Время начала */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Начало
                        </label>
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateTimeSlot(date, slot.id, 'startTime', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* Время окончания */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Окончание
                        </label>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateTimeSlot(date, slot.id, 'endTime', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* Стоимость */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Стоимость (₸)
                        </label>
                        <input
                          type="number"
                          value={slot.cost}
                          onChange={(e) => updateTimeSlot(date, slot.id, 'cost', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                          min="0"
                          step="100"
                        />
                      </div>

                      {/* Статус оплаты */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Статус оплаты
                        </label>
                        <select
                          value={slot.paymentStatus}
                          onChange={(e) => updateTimeSlot(date, slot.id, 'paymentStatus', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                        >
                          {PAYMENT_STATUS_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Кнопка удаления */}
                      <div className="flex items-end">
                        <button
                          onClick={() => removeTimeSlot(date, slot.id)}
                          className="w-full px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                          title="Удалить занятие"
                        >
                          <Minus className="w-3 h-3 mx-auto" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Подсказка */}
      <div className="p-4 bg-blue-50 border-t border-gray-200">
        <div className="flex items-start space-x-2">
          <FileText className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Советы по настройке:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Для каждого выбранного дня автоматически создается одно занятие</li>
              <li>Можно добавить несколько занятий в один день</li>
              <li>Стоимость рассчитывается автоматически</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
