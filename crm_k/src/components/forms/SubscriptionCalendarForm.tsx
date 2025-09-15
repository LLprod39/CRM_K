'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  User, 
  DollarSign, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Users, 
  CalendarDays,
  FileText,
  Eye,
  Plus,
  Minus,
  CreditCard
} from 'lucide-react';
import { Student } from '@/types';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/presentation/contexts';
import StudentSearch from '@/components/ui/StudentSearch';
import UserSelector from '@/components/ui/UserSelector';

interface SubscriptionCalendarFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SelectedDate {
  date: Date;
  isSelected: boolean;
  isPrepaid: boolean;
}

interface LessonPreview {
  date: Date;
  endTime: Date;
  dayName: string;
  cost: number;
  isPrepaid: boolean;
  status: 'scheduled' | 'prepaid';
}

export default function SubscriptionCalendarForm({ 
  isOpen, 
  onClose, 
  onSuccess 
}: SubscriptionCalendarFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    studentId: '',
    userId: null as number | null,
    cost: '',
    lessonType: 'individual' as 'individual' | 'group',
    notes: '',
    time: '10:00',
    duration: '60',
    isPrepaid: false
  });
  
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [selectedDates, setSelectedDates] = useState<SelectedDate[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showPreview, setShowPreview] = useState(false);
  const [lessonPreview, setLessonPreview] = useState<LessonPreview[]>([]);

  // Дни недели для отображения
  const weekDays = [
    { value: 1, label: 'Пн' },
    { value: 2, label: 'Вт' },
    { value: 3, label: 'Ср' },
    { value: 4, label: 'Чт' },
    { value: 5, label: 'Пт' },
    { value: 6, label: 'Сб' },
    { value: 0, label: 'Вс' }
  ];

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  // Функция для вычисления времени окончания
  const calculateEndTime = () => {
    if (!formData.time || !formData.duration) return '';
    
    try {
      const [hours, minutes] = formData.time.split(':').map(Number);
      const durationMinutes = parseInt(formData.duration);
      
      const startTime = new Date();
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
      
      return endTime.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } catch (error) {
      return '';
    }
  };

  // Загружаем список учеников
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await apiRequest('/api/students');
        if (response.ok) {
          const data = await response.json();
          setStudents(data);
        } else {
          console.error('Ошибка при загрузке учеников:', response.status);
        }
      } catch (error) {
        console.error('Ошибка при загрузке учеников:', error);
      }
    };

    if (isOpen) {
      fetchStudents();
    }
  }, [isOpen]);

  // Фильтруем учеников по выбранному пользователю
  const filteredStudents = user?.role === 'ADMIN' 
    ? students 
    : students.filter(student => student.userId === formData.userId);

  // Генерируем предварительный просмотр занятий
  useEffect(() => {
    if (selectedDates.length > 0 && formData.cost && formData.time) {
      const preview = generateLessonPreview();
      setLessonPreview(preview);
    } else {
      setLessonPreview([]);
    }
  }, [selectedDates, formData.cost, formData.time, formData.duration, formData.isPrepaid]);

  const generateLessonPreview = (): LessonPreview[] => {
    const preview: LessonPreview[] = [];
    const [hours, minutes] = formData.time.split(':').map(Number);

    selectedDates.forEach(selectedDate => {
      if (selectedDate.isSelected) {
        const lessonDate = new Date(selectedDate.date);
        lessonDate.setHours(hours, minutes, 0, 0);
        
        const endTime = new Date(lessonDate.getTime() + parseInt(formData.duration) * 60000);
        
        const dayInfo = weekDays.find(d => d.value === lessonDate.getDay());
        
        preview.push({
          date: lessonDate,
          endTime: endTime,
          dayName: dayInfo ? dayInfo.label : 'Неизвестно',
          cost: parseFloat(formData.cost) || 0,
          isPrepaid: selectedDate.isPrepaid,
          status: selectedDate.isPrepaid ? 'prepaid' : 'scheduled'
        });
      }
    });

    return preview.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  // Получаем дни месяца для календаря
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Понедельник = 0
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentMonth.getMonth() === today.getMonth() && 
           currentMonth.getFullYear() === today.getFullYear();
  };

  const isDateSelected = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return selectedDates.some(sd => 
      sd.date.getDate() === date.getDate() &&
      sd.date.getMonth() === date.getMonth() &&
      sd.date.getFullYear() === date.getFullYear() &&
      sd.isSelected
    );
  };

  const isDatePrepaid = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const selectedDate = selectedDates.find(sd => 
      sd.date.getDate() === date.getDate() &&
      sd.date.getMonth() === date.getMonth() &&
      sd.date.getFullYear() === date.getFullYear()
    );
    return selectedDate?.isPrepaid || false;
  };

  const handleDateClick = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const existingIndex = selectedDates.findIndex(sd => 
      sd.date.getDate() === date.getDate() &&
      sd.date.getMonth() === date.getMonth() &&
      sd.date.getFullYear() === date.getFullYear()
    );

    if (existingIndex >= 0) {
      // Переключаем выбор даты
      const updatedDates = [...selectedDates];
      updatedDates[existingIndex] = {
        ...updatedDates[existingIndex],
        isSelected: !updatedDates[existingIndex].isSelected
      };
      setSelectedDates(updatedDates);
    } else {
      // Добавляем новую дату
      setSelectedDates([...selectedDates, {
        date,
        isSelected: true,
        isPrepaid: formData.isPrepaid
      }]);
    }
  };

  const handlePrepaidToggle = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const existingIndex = selectedDates.findIndex(sd => 
      sd.date.getDate() === date.getDate() &&
      sd.date.getMonth() === date.getMonth() &&
      sd.date.getFullYear() === date.getFullYear()
    );

    if (existingIndex >= 0) {
      const updatedDates = [...selectedDates];
      updatedDates[existingIndex] = {
        ...updatedDates[existingIndex],
        isPrepaid: !updatedDates[existingIndex].isPrepaid
      };
      setSelectedDates(updatedDates);
    }
  };

  const clearAllDates = () => {
    setSelectedDates([]);
  };

  const selectAllVisibleDates = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const newDates: SelectedDate[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      newDates.push({
        date,
        isSelected: true,
        isPrepaid: formData.isPrepaid
      });
    }

    setSelectedDates(newDates);
  };

  // Валидация формы
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (formData.lessonType === 'individual') {
      if (!formData.studentId) {
        errors.studentId = 'Выберите ученика';
      }
    } else {
      if (selectedStudents.length === 0) {
        errors.studentId = 'Выберите хотя бы одного ученика для группового занятия';
      }
    }
    
    if (!formData.cost || parseFloat(formData.cost) <= 0) {
      errors.cost = 'Стоимость должна быть больше 0';
    }
    
    if (!formData.duration || parseInt(formData.duration) < 1 || parseInt(formData.duration) > 480) {
      errors.duration = 'Продолжительность должна быть от 1 до 480 минут';
    }
    
    if (user?.role === 'ADMIN' && !formData.userId) {
      errors.userId = 'Выберите учителя';
    }

    if (selectedDates.filter(sd => sd.isSelected).length === 0) {
      errors.dates = 'Выберите хотя бы один день для занятий';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const selectedDatesOnly = selectedDates.filter(sd => sd.isSelected);
      const lessons = [];

      for (const selectedDate of selectedDatesOnly) {
        const [hours, minutes] = formData.time.split(':').map(Number);
        const lessonDate = new Date(selectedDate.date);
        lessonDate.setHours(hours, minutes, 0, 0);
        
        const endTime = new Date(lessonDate.getTime() + parseInt(formData.duration) * 60000);

        const lessonData = {
          date: lessonDate,
          endTime: endTime,
          studentId: formData.lessonType === 'individual' ? parseInt(String(formData.studentId)) : selectedStudents[0]?.id,
          studentIds: formData.lessonType === 'group' ? selectedStudents.map(s => s.id) : undefined,
          cost: parseFloat(formData.cost),
          isCompleted: false,
          isPaid: selectedDate.isPrepaid,
          isCancelled: false,
          notes: formData.notes,
          comment: '',
          lessonType: formData.lessonType,
          userId: formData.userId
        };

        const response = await apiRequest('/api/lessons', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(lessonData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка при создании занятия');
        }

        lessons.push(await response.json());
      }

      onSuccess();
      onClose();
      // Сбрасываем форму
      setFormData({
        studentId: '',
        userId: null,
        cost: '',
        lessonType: 'individual',
        notes: '',
        time: '10:00',
        duration: 60,
        isPrepaid: false
      });
      setSelectedStudents([]);
      setSelectedDates([]);
      setValidationErrors({});
      setLessonPreview([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при создании занятий');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    // Очищаем ошибку валидации при изменении поля
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleStudentSelectionChange = (students: Student[]) => {
    setSelectedStudents(students);
    
    // Для индивидуальных занятий обновляем studentId
    if (formData.lessonType === 'individual' && students.length > 0) {
      setFormData(prev => ({
        ...prev,
        studentId: students[0].id.toString()
      }));
    }
    
    // Очищаем ошибку валидации
    if (validationErrors.studentId) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.studentId;
        return newErrors;
      });
    }
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Пустые ячейки для начала месяца
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-20 border border-gray-200"></div>
      );
    }

    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      const isCurrentDay = isToday(day);
      const isSelected = isDateSelected(day);
      const isPrepaid = isDatePrepaid(day);

      days.push(
        <div
          key={day}
          className={`h-20 border border-gray-200 p-1 cursor-pointer hover:bg-gray-50 transition-all duration-200 ${
            isCurrentDay ? 'bg-blue-50' : ''
          } ${isSelected ? 'bg-blue-100' : ''}`}
          onClick={() => handleDateClick(day)}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-medium ${isCurrentDay ? 'text-blue-600' : 'text-gray-900'}`}>
              {day}
            </span>
            {isSelected && (
              <div className="flex items-center gap-1">
                {isPrepaid ? (
                  <div className="w-3 h-3 bg-yellow-400 rounded-full" title="Предоплачено" />
                ) : (
                  <div className="w-3 h-3 bg-blue-400 rounded-full" title="Запланировано" />
                )}
              </div>
            )}
          </div>
          {isSelected && (
            <div className="mt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrepaidToggle(day);
                }}
                className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 hover:scale-110 ${
                  isPrepaid 
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                }`}
                title={isPrepaid ? 'Предоплачено' : 'Запланировано'}
              >
                {isPrepaid ? (
                  <CreditCard className="w-4 h-4" />
                ) : (
                  <Calendar className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div>
            <h2 className="text-sm font-medium text-gray-900">Запись на несколько дней</h2>
            <p className="text-sm text-gray-600 mt-1">Выберите дни и настройте параметры занятий</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Левая колонка - Настройки */}
            <div className="space-y-6">
              {/* Выбор учителя - только для админов */}
              {user?.role === 'ADMIN' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Учитель
                  </label>
                  <UserSelector
                    selectedUserId={formData.userId || undefined}
                    onUserChange={(userId) => {
                      setFormData(prev => ({ ...prev, userId: userId || null }));
                    }}
                    placeholder="Выберите учителя..."
                    showUserCount={true}
                    className={validationErrors.userId ? 'border-red-300' : ''}
                  />
                  {validationErrors.userId && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {validationErrors.userId}
                    </p>
                  )}
                </div>
              )}

              {/* Выбор учеников */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.lessonType === 'individual' ? (
                    <>
                      <User className="w-4 h-4 inline mr-2" />
                      Ученик
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 inline mr-2" />
                      Ученики для группового занятия
                    </>
                  )}
                </label>
                <StudentSearch
                  students={filteredStudents}
                  selectedStudents={selectedStudents}
                  onSelectionChange={handleStudentSelectionChange}
                  placeholder={
                    user?.role === 'ADMIN' 
                      ? (formData.lessonType === 'individual' ? "Поиск любого ученика..." : "Поиск учеников для группового занятия...")
                      : (formData.lessonType === 'individual' 
                          ? (formData.userId ? "Поиск ученика..." : "Сначала выберите учителя...") 
                          : (formData.userId ? "Поиск учеников для группового занятия..." : "Сначала выберите учителя..."))
                  }
                  multiple={formData.lessonType === 'group'}
                  className={validationErrors.studentId ? 'border-red-300' : ''}
                  disabled={user?.role !== 'ADMIN' && !formData.userId}
                />
                {validationErrors.studentId && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors.studentId}
                  </p>
                )}
                {formData.lessonType === 'group' && selectedStudents.length > 0 && (
                  <p className="mt-2 text-sm text-gray-600">
                    Выбрано учеников: {selectedStudents.length}
                  </p>
                )}
              </div>

              {/* Тип занятия */}
              <div>
                <label htmlFor="lessonType" className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Тип занятия
                </label>
                <select
                  id="lessonType"
                  name="lessonType"
                  value={formData.lessonType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="individual">Индивидуальное</option>
                  <option value="group">Групповое</option>
                </select>
              </div>

              {/* Стоимость */}
              <div>
                <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Стоимость за занятие (тенге)
                </label>
                <input
                  type="number"
                  id="cost"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.cost ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {validationErrors.cost && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors.cost}
                  </p>
                )}
              </div>

              {/* Время и продолжительность */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">
                  Время и продолжительность
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                      Время начала
                    </label>
                    <input
                      type="time"
                      id="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    {formData.time && formData.duration && calculateEndTime() && (
                      <p className="mt-2 text-sm text-gray-600 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Занятие закончится в {calculateEndTime()}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                      Продолжительность (минуты)
                    </label>
                    <input
                      type="number"
                      id="duration"
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      min="1"
                      max="480"
                      placeholder="60"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    {validationErrors.duration && (
                      <p className="mt-1 text-sm text-red-600">
                        {validationErrors.duration}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Заметки */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Заметки и комментарии
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Дополнительная информация о занятиях..."
                />
              </div>
            </div>

            {/* Правая колонка - Календарь */}
            <div className="space-y-6">
              {/* Календарь */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => navigateMonth('prev')}
                      className="p-2 hover:bg-gray-100 rounded-md"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateMonth('next')}
                      className="p-2 hover:bg-gray-100 rounded-md"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Дни недели */}
                <div className="grid grid-cols-7 border-b border-gray-200">
                  {weekDays.map((day) => (
                    <div key={day.value} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50">
                      {day.label}
                    </div>
                  ))}
                </div>

                {/* Календарная сетка */}
                <div className="grid grid-cols-7">
                  {renderCalendarDays()}
                </div>

                {/* Управление выбором */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-sm font-medium text-gray-700">
                      Выбрано дней: {selectedDates.filter(sd => sd.isSelected).length}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={selectAllVisibleDates}
                        className="text-xs px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                      >
                        Выбрать все
                      </button>
                      <button
                        type="button"
                        onClick={clearAllDates}
                        className="text-xs px-3 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                      >
                        Очистить
                      </button>
                    </div>
                  </div>
                  
                  {validationErrors.dates && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {validationErrors.dates}
                    </p>
                  )}

                  {/* Легенда */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      <span>Запланировано</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <span>Предоплачено</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Предварительный просмотр */}
              {lessonPreview.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-normal text-gray-900">
                      Предварительный просмотр ({lessonPreview.length} занятий)
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {showPreview ? 'Скрыть' : 'Показать'}
                    </button>
                  </div>
                  
                  {showPreview && (
                    <div className="max-h-60 overflow-y-auto">
                      <div className="space-y-2">
                        {lessonPreview.map((lesson, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-medium text-gray-600">
                                {lesson.date.toLocaleDateString('ru-RU')}
                              </span>
                              <span className="text-sm text-gray-500">
                                {lesson.dayName}
                              </span>
                              <span className="text-sm text-gray-500">
                                {lesson.date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} - 
                                {lesson.endTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs px-2 py-1 rounded ${
                                lesson.isPrepaid 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {lesson.isPrepaid ? 'Предоплачено' : 'Запланировано'}
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {lesson.cost.toLocaleString()} ₸
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading || lessonPreview.length === 0}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Создание занятий...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Создать {lessonPreview.length} занятий
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
