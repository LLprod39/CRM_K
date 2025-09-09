'use client'

import { useState, useEffect } from 'react'
import { X, DollarSign, Calendar, User, FileText, CheckCircle } from 'lucide-react'
import { Student, PaymentFormData, CreatePaymentData } from '@/types'
import { useToastContext } from '@/contexts/ToastContext'
import { apiRequest } from '@/lib/api'

interface AddPaymentFormProps {
  isOpen: boolean
  onClose: () => void
  onPaymentAdded: () => void
  students: Student[]
}

interface UnpaidLesson {
  id: number
  date: Date
  cost: number
  notes?: string
}

interface UnpaidLessonsResponse {
  student: Student
  unpaidLessons: UnpaidLesson[]
  totalDebt: number
  count: number
}

export default function AddPaymentForm({ 
  isOpen, 
  onClose, 
  onPaymentAdded, 
  students 
}: AddPaymentFormProps) {
  const [formData, setFormData] = useState<PaymentFormData>({
    studentId: 0,
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    lessonIds: []
  })
  const [unpaidLessons, setUnpaidLessons] = useState<UnpaidLesson[]>([])
  const [totalDebt, setTotalDebt] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingLessons, setIsLoadingLessons] = useState(false)
  const { success, error } = useToastContext()

  // Сброс формы при закрытии
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        studentId: 0,
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        lessonIds: []
      })
      setUnpaidLessons([])
      setTotalDebt(0)
    }
  }, [isOpen])

  // Загрузка неоплаченных уроков при выборе ученика
  useEffect(() => {
    if (formData.studentId && formData.studentId > 0) {
      loadUnpaidLessons(formData.studentId)
    } else {
      setUnpaidLessons([])
      setTotalDebt(0)
    }
  }, [formData.studentId])

  const loadUnpaidLessons = async (studentId: number) => {
    setIsLoadingLessons(true)
    try {
      const response = await apiRequest(`/api/payments/unpaid-lessons?studentId=${studentId}`)
      if (response.ok) {
        const data: UnpaidLessonsResponse = await response.json()
        setUnpaidLessons(data.unpaidLessons)
        setTotalDebt(data.totalDebt)
        
        // Автоматически устанавливаем сумму равную общей задолженности
        setFormData(prev => ({
          ...prev,
          amount: data.totalDebt.toString()
        }))
      } else {
        error('Ошибка при загрузке неоплаченных уроков')
      }
    } catch (error) {
      console.error('Ошибка при загрузке неоплаченных уроков:', error)
      error('Ошибка при загрузке неоплаченных уроков')
    } finally {
      setIsLoadingLessons(false)
    }
  }

  const handleInputChange = (field: keyof PaymentFormData, value: string | number | number[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleLessonToggle = (lessonId: number) => {
    setFormData(prev => ({
      ...prev,
      lessonIds: prev.lessonIds.includes(lessonId)
        ? prev.lessonIds.filter(id => id !== lessonId)
        : [...prev.lessonIds, lessonId]
    }))
  }

  const handleSelectAllLessons = () => {
    setFormData(prev => ({
      ...prev,
      lessonIds: unpaidLessons.map(lesson => lesson.id)
    }))
  }

  const handleClearLessons = () => {
    setFormData(prev => ({
      ...prev,
      lessonIds: []
    }))
  }

  const calculateSelectedAmount = () => {
    return unpaidLessons
      .filter(lesson => formData.lessonIds.includes(lesson.id))
      .reduce((sum, lesson) => sum + lesson.cost, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.studentId || !formData.amount || !formData.date) {
      error('Заполните все обязательные поля')
      return
    }

    if (parseFloat(formData.amount) <= 0) {
      error('Сумма платежа должна быть больше нуля')
      return
    }

    setIsLoading(true)
    try {
      const paymentData: CreatePaymentData = {
        studentId: formData.studentId,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date),
        description: formData.description || undefined,
        lessonIds: formData.lessonIds.length > 0 ? formData.lessonIds : undefined
      }

      const response = await apiRequest('/api/payments', {
        method: 'POST',
        body: JSON.stringify(paymentData)
      })

      if (response.ok) {
        success('Платеж успешно добавлен')
        onPaymentAdded()
        onClose()
      } else {
        const errorData = await response.json()
        error(errorData.error || 'Ошибка при создании платежа')
      }
    } catch (error) {
      console.error('Ошибка при создании платежа:', error)
      error('Ошибка при создании платежа')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const selectedAmount = calculateSelectedAmount()
  const selectedStudent = students.find(s => s.id === formData.studentId)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <DollarSign className="w-6 h-6 text-green-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Добавить платеж</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Выбор ученика */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Ученик *
            </label>
            <select
              value={formData.studentId || ''}
              onChange={(e) => handleInputChange('studentId', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              required
            >
              <option value={0}>Выберите ученика</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.fullName} (возраст: {student.age})
                </option>
              ))}
            </select>
          </div>

          {/* Неоплаченные уроки */}
          {formData.studentId && formData.studentId > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Неоплаченные уроки
                  {isLoadingLessons && <span className="ml-2 text-sm text-gray-500">(загрузка...)</span>}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllLessons}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Выбрать все
                  </button>
                  <button
                    type="button"
                    onClick={handleClearLessons}
                    className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                  >
                    Очистить
                  </button>
                </div>
              </div>
              
              {unpaidLessons.length > 0 ? (
                <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto">
                  {unpaidLessons.map(lesson => (
                    <label
                      key={lesson.id}
                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={formData.lessonIds.includes(lesson.id)}
                        onChange={() => handleLessonToggle(lesson.id)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(lesson.date).toLocaleDateString('ru-RU')}
                          </span>
                          <span className="text-sm font-bold text-green-600">
                            {lesson.cost.toLocaleString('ru-RU')} ₽
                          </span>
                        </div>
                        {lesson.notes && (
                          <p className="text-xs text-gray-500 mt-1">{lesson.notes}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>У ученика нет неоплаченных уроков</p>
                </div>
              )}
              
              {selectedAmount > 0 && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Выбрано уроков на сумму: {selectedAmount.toLocaleString('ru-RU')} ₽</strong>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Сумма платежа */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Сумма платежа *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              placeholder="Введите сумму платежа"
              required
            />
            {totalDebt > 0 && (
              <p className="mt-1 text-sm text-gray-500">
                Общая задолженность: {totalDebt.toLocaleString('ru-RU')} ₽
              </p>
            )}
          </div>

          {/* Дата платежа */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Дата платежа *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              required
            />
          </div>

          {/* Описание */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
              rows={3}
              placeholder="Дополнительная информация о платеже (необязательно)"
            />
          </div>

          {/* Кнопки */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Создание...' : 'Создать платеж'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
