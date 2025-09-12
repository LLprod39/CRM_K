'use client';

import { useState } from 'react';
import { X, User, Phone, Calendar, FileText, MessageSquare, UserPlus, Sparkles, Clock, DollarSign, BookOpen } from 'lucide-react';
import { CreateStudentData, CreateLessonData } from '@/types';
import { useAuth } from '@/presentation/contexts';
import { apiRequest } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PhotoUpload from './PhotoUpload';
import DateTimePicker from '@/components/ui/DateTimePicker';
import UserSelector from '@/components/ui/UserSelector';
import UnifiedSubscriptionModal from './UnifiedSubscriptionModal';

interface AddStudentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddStudentForm({ isOpen, onClose, onSuccess }: AddStudentFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CreateStudentData>({
    fullName: '',
    phone: '',
    age: 0,
    parentName: '',
    diagnosis: '',
    comment: '',
    photoUrl: ''
  });
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [lessonData, setLessonData] = useState<CreateLessonData>({
    date: new Date(),
    endTime: new Date(Date.now() + 60 * 60 * 1000), // +1 час по умолчанию
    studentId: 0,
    cost: 0,
    isCompleted: false,
    isPaid: false,
    isCancelled: false,
    notes: '',
    lessonType: 'individual'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createLesson, setCreateLesson] = useState(false);
  const [step, setStep] = useState<'student' | 'lesson'>('student');
  const [showUnifiedSubscriptionForm, setShowUnifiedSubscriptionForm] = useState(false);
  const [createdStudent, setCreatedStudent] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('lesson_')) {
      const lessonField = name.replace('lesson_', '') as keyof CreateLessonData;
      setLessonData(prev => ({
        ...prev,
        [lessonField]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                     lessonField === 'cost' ? parseFloat(value) || 0 :
                     lessonField === 'date' || lessonField === 'endTime' ? new Date(value) : value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'age' ? parseInt(value) || 0 : value
      }));
    }
    
    // Очищаем ошибку при изменении поля
    if (errors[name as keyof CreateStudentData]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Для админов проверяем выбор пользователя только если создаем занятие
    if (user?.role === 'ADMIN' && createLesson && !selectedUserId) {
      newErrors.userId = 'Выберите пользователя (учителя)';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'ФИО обязательно для заполнения';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Телефон обязателен для заполнения';
    } else if (!/^[\+]?[0-9\s\-\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Введите корректный номер телефона';
    }

    if (!formData.parentName.trim()) {
      newErrors.parentName = 'ФИО родителя обязательно для заполнения';
    }

    if (!formData.age || formData.age < 1 || formData.age > 100) {
      newErrors.age = 'Возраст должен быть от 1 до 100 лет';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createStudent = async () => {
    if (!validateForm()) {
      return null;
    }

    setLoading(true);
    
    try {
      // Создаем ученика
      // Для админов: если выбран учитель - привязываем к нему, иначе к админу
      // Для обычных пользователей - привязываем к текущему пользователю
      const studentData = user?.role === 'ADMIN' 
        ? { ...formData, userId: selectedUserId || user.id }
        : formData;
        
      const studentResponse = await apiRequest('/api/students', {
        method: 'POST',
        body: JSON.stringify(studentData),
      });

      if (studentResponse.ok) {
        const newStudent = await studentResponse.json();
        return newStudent;
      } else {
        const errorData = await studentResponse.json();
        alert(errorData.error || 'Ошибка при создании ученика');
        return null;
      }
    } catch (error) {
      console.error('Ошибка при создании ученика:', error);
      alert('Ошибка при создании ученика');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newStudent = await createStudent();
    
    if (newStudent) {
      setCreatedStudent(newStudent);
      
      // Если нужно создать занятие
      if (createLesson) {
        const lessonRequestData = {
          ...lessonData,
          studentId: newStudent.id,
          userId: user?.role === 'ADMIN' ? selectedUserId : undefined
        };
        
        const lessonResponse = await apiRequest('/api/lessons', {
          method: 'POST',
          body: JSON.stringify(lessonRequestData),
        });

        if (!lessonResponse.ok) {
          const errorData = await lessonResponse.json();
          alert(`Ученик создан, но ошибка при создании занятия: ${errorData.error}`);
        }
      }

      // Сбрасываем форму только если не создаем абонемент
      if (!showUnifiedSubscriptionForm) {
        resetForm();
        onSuccess();
        onClose();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      phone: '',
      age: 0,
      parentName: '',
      diagnosis: '',
      comment: '',
      photoUrl: ''
    });
    setLessonData({
      date: new Date(),
      endTime: new Date(Date.now() + 60 * 60 * 1000),
      studentId: 0,
      cost: 0,
      isCompleted: false,
      isPaid: false,
      isCancelled: false,
      notes: '',
      lessonType: 'individual'
    });
    setErrors({});
    setCreateLesson(false);
    setStep('student');
    setSelectedUserId(null);
    setCreatedStudent(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-scale-in border border-gray-200/50">
        {/* Заголовок в стиле сайта */}
        <div className="bg-white/95 backdrop-blur-sm p-6 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {step === 'student' ? 'Добавить ученика' : 'Записать на занятие'}
                </h2>
                <p className="text-gray-600 text-sm">
                  {step === 'student' 
                    ? 'Заполните информацию о новом ученике' 
                    : 'Настройте параметры занятия для нового ученика'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {step === 'lesson' && user?.role === 'ADMIN' && (
                <>
                  <button
                    type="button"
                    onClick={async () => {
                      const newStudent = await createStudent();
                      if (newStudent) {
                        setCreatedStudent(newStudent);
                        setShowUnifiedSubscriptionForm(true);
                      }
                    }}
                    className="px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors font-medium"
                    title="Создать абонемент (обычный или гибкий)"
                  >
                    Создать абонемент
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-110 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Индикатор шагов */}
          <div className="flex items-center mt-4 space-x-2">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              step === 'student' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
            }`}>
              <User className="w-4 h-4" />
              <span>Данные ученика</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              step === 'lesson' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
            }`}>
              <Calendar className="w-4 h-4" />
              <span>Занятие</span>
            </div>
          </div>
        </div>

        {/* Форма */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto bg-gray-50/30">
          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 'student' ? (
              <>
                {/* Фото ученика */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200/50">
                  <PhotoUpload
                    currentPhotoUrl={formData.photoUrl}
                    onPhotoChange={(photoUrl) => setFormData(prev => ({ ...prev, photoUrl: photoUrl || '' }))}
                  />
                </div>

                {/* ФИО ученика и родителя */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Input
                        label="ФИО ученика"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Введите полное имя"
                        error={errors.fullName}
                        icon={<User className="w-4 h-4" />}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        label="ФИО родителя/опекуна"
                        name="parentName"
                        value={formData.parentName}
                        onChange={handleInputChange}
                        placeholder="Введите ФИО родителя или опекуна"
                        error={errors.parentName}
                        icon={<User className="w-4 h-4" />}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Телефон */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200/50">
                  <Input
                    label="Телефон родителей"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+7 (999) 123-45-67"
                    error={errors.phone}
                    icon={<Phone className="w-4 h-4" />}
                    required
                  />
                </div>

                {/* Возраст и диагноз */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Input
                        label="Возраст"
                        name="age"
                        type="number"
                        value={formData.age || ''}
                        onChange={handleInputChange}
                        placeholder="Возраст в годах"
                        error={errors.age}
                        icon={<Calendar className="w-4 h-4" />}
                        min="1"
                        max="100"
                        required
                      />
                    </div>
                    <div>
                      <Input
                        label="Диагноз (необязательно)"
                        name="diagnosis"
                        value={formData.diagnosis}
                        onChange={handleInputChange}
                        placeholder="Например: Аутизм, ЗПР, ДЦП"
                        icon={<FileText className="w-4 h-4" />}
                        helperText="Медицинский диагноз или особенности развития"
                      />
                    </div>
                  </div>
                </div>

                {/* Комментарий */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200/50">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <MessageSquare className="w-4 h-4 inline mr-2" />
                      Комментарий
                    </label>
                    <textarea
                      name="comment"
                      value={formData.comment}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 transition-all duration-200 resize-none"
                      placeholder="Дополнительная информация о ученике..."
                    />
                  </div>
                </div>

                {/* Опция записи на занятие */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200/50">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="createLesson"
                      checked={createLesson}
                      onChange={(e) => setCreateLesson(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="createLesson" className="text-sm font-medium text-gray-700">
                      Сразу записать на занятие
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    После создания ученика откроется форма для записи на занятие
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Выбор пользователя - только для админов */}
                {user?.role === 'ADMIN' && (
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200/50">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Пользователь (учитель)
                    </label>
                    <UserSelector
                      selectedUserId={selectedUserId || undefined}
                      onUserChange={(userId) => setSelectedUserId(userId || null)}
                      placeholder="Выберите учителя..."
                      showUserCount={true}
                      className={errors.userId ? 'border-red-300' : ''}
                    />
                    {errors.userId && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <X className="w-4 h-4 mr-1" />
                        {errors.userId}
                      </p>
                    )}
                  </div>
                )}

                {/* Время проведения */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200/50">
                  <DateTimePicker
                    value={lessonData.date.toISOString()}
                    onChange={(value: string) => {
                      const startTime = new Date(value);
                      const newDateString = startTime.toISOString();
                      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // +1 час по умолчанию
                      
                      setLessonData(prev => ({
                        ...prev,
                        date: startTime,
                        endTime: endTime
                      }));
                    }}
                    showDurationSelector={true}
                    defaultDuration={60}
                  />
                </div>

                {/* Стоимость и тип занятия */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <DollarSign className="w-4 h-4 inline mr-2" />
                        Стоимость (тенге)
                      </label>
                      <input
                        type="number"
                        name="lesson_cost"
                        value={lessonData.cost || ''}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <BookOpen className="w-4 h-4 inline mr-2" />
                        Тип занятия
                      </label>
                      <select
                        name="lesson_lessonType"
                        value={lessonData.lessonType}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="individual">Индивидуальное</option>
                        <option value="group">Групповое</option>
                      </select>
                    </div>
                  </div>
                </div>


                {/* Заметки к занятию */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200/50">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    Заметки к занятию
                  </label>
                  <textarea
                    name="lesson_notes"
                    value={lessonData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 transition-all duration-200 resize-none"
                    placeholder="Цели, задачи, особенности занятия..."
                  />
                </div>
              </>
            )}

            {/* Кнопки */}
            <div className="flex space-x-3 pt-4">
              {step === 'student' ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    fullWidth
                    className="border-gray-300 hover:bg-gray-50 text-gray-700"
                  >
                    Отмена
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => {
                      if (createLesson) {
                        setStep('lesson');
                      } else {
                        handleSubmit(new Event('submit') as any);
                      }
                    }}
                    fullWidth
                    icon={<Calendar className="w-4 h-4" />}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    {createLesson ? 'Далее: Занятие' : 'Только добавить ученика'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('student')}
                    fullWidth
                    className="border-gray-300 hover:bg-gray-50 text-gray-700"
                  >
                    Назад
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    fullWidth
                    icon={<Sparkles className="w-4 h-4" />}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    {loading ? 'Сохранение...' : 'Создать ученика и занятие'}
                  </Button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
      
      {/* Унифицированное модальное окно абонемента */}
      <UnifiedSubscriptionModal
        isOpen={showUnifiedSubscriptionForm}
        onClose={() => {
          setShowUnifiedSubscriptionForm(false);
          resetForm();
          onSuccess();
          onClose();
        }}
        onSuccess={() => {
          setShowUnifiedSubscriptionForm(false);
          resetForm();
          onSuccess();
          onClose();
        }}
        selectedStudent={createdStudent}
      />
    </div>
  );
}
