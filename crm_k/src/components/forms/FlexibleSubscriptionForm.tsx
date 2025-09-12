'use client'

import React, { useState, useEffect } from 'react'
import { apiRequest } from '@/lib/api'
import { FlexibleSubscriptionFormData, FlexibleSubscriptionWeekFormData, FlexibleSubscriptionDayFormData, Student, User } from '@/types'

interface FlexibleSubscriptionFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  selectedStudent?: Student
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Понедельник' },
  { value: 2, label: 'Вторник' },
  { value: 3, label: 'Среда' },
  { value: 4, label: 'Четверг' },
  { value: 5, label: 'Пятница' },
  { value: 6, label: 'Суббота' },
  { value: 0, label: 'Воскресенье' }
]

const LOCATIONS = [
  { value: 'office', label: 'Офис' },
  { value: 'online', label: 'Онлайн' },
  { value: 'home', label: 'На дому' }
]

export default function FlexibleSubscriptionForm({ 
  isOpen, 
  onClose, 
  onSuccess,
  selectedStudent 
}: FlexibleSubscriptionFormProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<FlexibleSubscriptionFormData>({
    name: '',
    studentId: selectedStudent?.id || 0,
    userId: 0,
    startDate: '',
    endDate: '',
    description: '',
    weekSchedules: []
  })

  // Загружаем данные при открытии формы
  useEffect(() => {
    if (isOpen) {
      loadStudents()
      loadUsers()
      
      // Добавляем первую неделю по умолчанию
      if (formData.weekSchedules.length === 0) {
        addWeek()
      }
    }
  }, [isOpen])

  const loadStudents = async () => {
    try {
      const response = await apiRequest('/api/students')
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
      }
    } catch (error) {
      console.error('Ошибка при загрузке учеников:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await apiRequest('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Ошибка при загрузке пользователей:', error)
    }
  }

  const addWeek = () => {
    const newWeek: FlexibleSubscriptionWeekFormData = {
      weekNumber: formData.weekSchedules.length + 1,
      startDate: '',
      endDate: '',
      weekDays: []
    }
    
    setFormData(prev => ({
      ...prev,
      weekSchedules: [...prev.weekSchedules, newWeek]
    }))
  }

  const removeWeek = (weekIndex: number) => {
    setFormData(prev => ({
      ...prev,
      weekSchedules: prev.weekSchedules.filter((_, index) => index !== weekIndex)
    }))
  }

  const addDayToWeek = (weekIndex: number) => {
    const newDay: FlexibleSubscriptionDayFormData = {
      dayOfWeek: 1, // Понедельник по умолчанию
      startTime: '10:00',
      endTime: '11:00',
      cost: '1000',
      location: 'office',
      notes: ''
    }

    setFormData(prev => ({
      ...prev,
      weekSchedules: prev.weekSchedules.map((week, index) => 
        index === weekIndex 
          ? { ...week, weekDays: [...week.weekDays, newDay] }
          : week
      )
    }))
  }

  const removeDayFromWeek = (weekIndex: number, dayIndex: number) => {
    setFormData(prev => ({
      ...prev,
      weekSchedules: prev.weekSchedules.map((week, index) => 
        index === weekIndex 
          ? { ...week, weekDays: week.weekDays.filter((_, dIndex) => dIndex !== dayIndex) }
          : week
      )
    }))
  }

  const updateWeek = (weekIndex: number, field: keyof FlexibleSubscriptionWeekFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      weekSchedules: prev.weekSchedules.map((week, index) => 
        index === weekIndex 
          ? { ...week, [field]: value }
          : week
      )
    }))
  }

  const updateDay = (weekIndex: number, dayIndex: number, field: keyof FlexibleSubscriptionDayFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      weekSchedules: prev.weekSchedules.map((week, wIndex) => 
        wIndex === weekIndex 
          ? {
              ...week,
              weekDays: week.weekDays.map((day, dIndex) => 
                dIndex === dayIndex 
                  ? { ...day, [field]: value }
                  : day
              )
            }
          : week
      )
    }))
  }

  const calculateTotalCost = () => {
    return formData.weekSchedules.reduce((total, week) => {
      return total + week.weekDays.reduce((weekTotal, day) => {
        return weekTotal + (parseFloat(day.cost) || 0)
      }, 0)
    }, 0)
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Введите название абонемента')
      return false
    }

    if (!formData.studentId) {
      setError('Выберите ученика')
      return false
    }

    if (!formData.userId) {
      setError('Выберите преподавателя')
      return false
    }

    if (!formData.startDate) {
      setError('Укажите дату начала')
      return false
    }

    if (!formData.endDate) {
      setError('Укажите дату окончания')
      return false
    }

    if (formData.weekSchedules.length === 0) {
      setError('Добавьте хотя бы одну неделю расписания')
      return false
    }

    for (const week of formData.weekSchedules) {
      if (!week.startDate || !week.endDate) {
        setError('Укажите даты начала и окончания для всех недель')
        return false
      }

      if (week.weekDays.length === 0) {
        setError('Добавьте хотя бы один день для каждой недели')
        return false
      }

      for (const day of week.weekDays) {
        if (!day.startTime || !day.endTime) {
          setError('Укажите время начала и окончания для всех дней')
          return false
        }

        if (!day.cost || parseFloat(day.cost) <= 0) {
          setError('Укажите корректную стоимость для всех дней')
          return false
        }
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('Начало отправки формы:', formData)
    
    if (!validateForm()) {
      console.log('Валидация не прошла')
      return
    }
    
    setLoading(true)
    setError('')

    try {
      const requestData = {
        ...formData,
        totalCost: calculateTotalCost()
      }
      
      console.log('Отправляемые данные:', requestData)
      
      const response = await apiRequest('/api/flexible-subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      console.log('Ответ сервера:', response.status, response.statusText)

      if (response.ok) {
        console.log('Абонемент успешно создан')
        onSuccess()
        onClose()
      } else {
        const errorData = await response.json()
        console.error('Ошибка сервера:', errorData)
        setError(errorData.error || 'Ошибка при создании абонемента')
      }
    } catch (err) {
      console.error('Ошибка при отправке запроса:', err)
      setError('Ошибка при создании абонемента')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Создание гибкого абонемента</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Основная информация */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название абонемента *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Например: Абонемент на месяц"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ученик *
              </label>
              <select
                value={formData.studentId}
                onChange={(e) => setFormData(prev => ({ ...prev, studentId: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value={0}>Выберите ученика</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Преподаватель *
              </label>
              <select
                value={formData.userId}
                onChange={(e) => setFormData(prev => ({ ...prev, userId: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value={0}>Выберите преподавателя</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Описание абонемента"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Дата начала *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Дата окончания *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Расписание недель */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Расписание недель</h3>
              <button
                type="button"
                onClick={addWeek}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Добавить неделю
              </button>
            </div>

            {formData.weekSchedules.map((week, weekIndex) => (
              <div key={weekIndex} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-gray-900">Неделя {week.weekNumber}</h4>
                  <button
                    type="button"
                    onClick={() => removeWeek(weekIndex)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Удалить неделю
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Дата начала недели *
                    </label>
                    <input
                      type="date"
                      value={week.startDate}
                      onChange={(e) => updateWeek(weekIndex, 'startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Дата окончания недели *
                    </label>
                    <input
                      type="date"
                      value={week.endDate}
                      onChange={(e) => updateWeek(weekIndex, 'endDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Дни недели */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="font-medium text-gray-700">Дни недели</h5>
                    <button
                      type="button"
                      onClick={() => addDayToWeek(weekIndex)}
                      className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                    >
                      Добавить день
                    </button>
                  </div>

                  {week.weekDays.map((day, dayIndex) => (
                    <div key={dayIndex} className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-2 p-3 bg-gray-50 rounded">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">День</label>
                        <select
                          value={day.dayOfWeek}
                          onChange={(e) => updateDay(weekIndex, dayIndex, 'dayOfWeek', parseInt(e.target.value))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {DAYS_OF_WEEK.map(dayOption => (
                            <option key={dayOption.value} value={dayOption.value}>
                              {dayOption.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Начало</label>
                        <input
                          type="time"
                          value={day.startTime}
                          onChange={(e) => updateDay(weekIndex, dayIndex, 'startTime', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Окончание</label>
                        <input
                          type="time"
                          value={day.endTime}
                          onChange={(e) => updateDay(weekIndex, dayIndex, 'endTime', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Стоимость</label>
                        <input
                          type="number"
                          value={day.cost}
                          onChange={(e) => updateDay(weekIndex, dayIndex, 'cost', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Место</label>
                        <select
                          value={day.location}
                          onChange={(e) => updateDay(weekIndex, dayIndex, 'location', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {LOCATIONS.map(location => (
                            <option key={location.value} value={location.value}>
                              {location.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeDayFromWeek(weekIndex, dayIndex)}
                          className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Общая стоимость */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-lg font-semibold text-blue-900">
              Общая стоимость: {calculateTotalCost().toLocaleString('ru-RU')} ₽
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Создание...' : 'Создать абонемент'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
