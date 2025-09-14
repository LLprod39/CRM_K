'use client';

import { useState, useEffect } from 'react';
import { X, Trash2, Calendar, User, DollarSign, CheckCircle, Clock, AlertTriangle, FileText, MessageSquare, Edit3, Save, AlertCircle, Phone, BookOpen } from 'lucide-react';
import { Student, Lesson } from '@/types';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/presentation/contexts';
import DateTimePicker from '../ui/DateTimePicker';
import { useConfirmDialog } from '../ui/ConfirmDialog';
import { LessonStatusGroup } from '../ui/LessonStatusBadge';
import { formatTime, formatDate } from '@/lib/timeUtils';
import Modal, { ModalSection, InfoCard, ModalFooter } from '../ui/Modal';

interface EditLessonFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onDelete: () => void;
  lesson: Lesson | null;
  userRole?: 'ADMIN' | 'USER';
}

export default function EditLessonForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  onDelete,
  lesson,
  userRole
}: EditLessonFormProps) {
  const { user } = useAuth();
  const { showConfirm, ConfirmDialogComponent } = useConfirmDialog();
  const [formData, setFormData] = useState({
    date: '',
    endTime: '',
    studentId: '',
    cost: '',
    isCompleted: false,
    isPaid: false,
    isCancelled: false,
    notes: '',
    comment: '',
    lessonType: 'individual' as 'individual' | 'group'
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');
  const [studentInfo, setStudentInfo] = useState<any>(null);

  // Загружаем список учеников
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await apiRequest('/api/students');
        if (response.ok) {
          const data = await response.json();
          setStudents(data);
        }
      } catch (error) {
        console.error('Ошибка при загрузке учеников:', error);
      }
    };

    if (isOpen) {
      fetchStudents();
    }
  }, [isOpen]);

  // Загружаем информацию об ученике
  useEffect(() => {
    const fetchStudentInfo = async () => {
      if (formData.studentId && isOpen) {
        try {
          const response = await apiRequest(`/api/students/${formData.studentId}`);
          if (response.ok) {
            const data = await response.json();
            setStudentInfo(data);
          }
        } catch (error) {
          console.error('Ошибка при загрузке информации об ученике:', error);
        }
      }
    };

    fetchStudentInfo();
  }, [formData.studentId, isOpen]);


  // Заполняем форму данными занятия
  useEffect(() => {
    if (lesson && isOpen) {
      // Используем локальное время без UTC смещения
      const startDate = new Date(lesson.date);
      const startTime = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}T${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
      
      let endTime = '';
      if (lesson.endTime) {
        const endDate = new Date(lesson.endTime);
        endTime = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}T${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
      }
      
      setFormData({
        date: startTime,
        endTime: endTime,
        studentId: lesson.studentId.toString(),
        cost: lesson.cost.toString(),
        isCompleted: lesson.isCompleted,
        isPaid: lesson.isPaid,
        isCancelled: lesson.isCancelled,
        notes: lesson.notes || '',
        comment: (lesson as any).comment || '',
        lessonType: (lesson as any).lessonType || 'individual'
      });
    }
  }, [lesson, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lesson) return;

    setLoading(true);
    setError('');

    try {
      const response = await apiRequest(`/api/lessons/${lesson.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: new Date(formData.date),
          studentId: parseInt(formData.studentId),
          cost: parseFloat(formData.cost),
          // Для обычных пользователей отправляем только статус отмены
          ...(user?.role === 'ADMIN' ? {
            isCompleted: formData.isCompleted,
            isPaid: formData.isPaid
          } : {}),
          isCancelled: formData.isCancelled,
          notes: formData.notes,
          comment: formData.comment
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка при обновлении занятия');
      }
    } catch {
      const errorMessage = 'Ошибка при обновлении занятия';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!lesson) return;

    showConfirm({
      title: 'Удаление занятия',
      message: 'Вы уверены, что хотите удалить это занятие? Это действие нельзя отменить.',
      type: 'danger',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      onConfirm: async () => {
        setDeleteLoading(true);
        setError('');

    try {
      const response = await apiRequest(`/api/lessons/${lesson.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete();
        onClose();
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Ошибка при удалении занятия';
        setError(errorMessage);
      }
    } catch {
      const errorMessage = 'Ошибка при удалении занятия';
      setError(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (!isOpen || !lesson) return null;

  // Подготавливаем заголовок с информацией о дате и времени
  const modalTitle = (
    <div className="flex-1">
      <h2 className="text-xl font-semibold text-gray-900">
        {userRole === 'ADMIN' ? 'Редактировать занятие' : 'Просмотр занятия'}
      </h2>
      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{formatDate(lesson.date, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-gray-400" />
          <span>{formatTime(lesson.date)}</span>
          {lesson.endTime && (
            <span className="text-gray-500"> - {formatTime(lesson.endTime)}</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="xl"
      footer={
        <ModalFooter
          onCancel={onClose}
          onConfirm={userRole === 'ADMIN' ? () => handleSubmit(new Event('submit') as any) : undefined}
          cancelText={userRole === 'USER' ? 'Закрыть' : 'Отмена'}
          confirmText="Сохранить изменения"
          loading={loading}
          variant="primary"
        />
      }
    >

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Дата и время */}
        <ModalSection 
          icon={<Calendar className="w-5 h-5 text-blue-600" />}
          title="Дата и время"
        >
            
          {userRole === 'ADMIN' ? (
            <DateTimePicker
              value={formData.date}
              onChange={(value: string) => {
                const startTime = new Date(value);
                const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
                const endTimeString = `${endTime.getFullYear()}-${String(endTime.getMonth() + 1).padStart(2, '0')}-${String(endTime.getDate()).padStart(2, '0')}T${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;
                
                setFormData(prev => ({
                  ...prev,
                  date: value,
                  endTime: endTimeString
                }));
              }}
              min={user?.role === 'ADMIN' ? undefined : new Date().toISOString()}
              showDurationSelector={true}
              defaultDuration={60}
            />
          ) : (
            <InfoCard
              icon={<Clock className="w-5 h-5" />}
              label="Время занятия"
              value={
                <>
                  {formatTime(formData.date)}
                  {formData.endTime && (
                    <span className="text-gray-500">
                      {' - '}
                      {formatTime(formData.endTime)}
                    </span>
                  )}
                </>
              }
            />
          )}
        </ModalSection>

        {/* Ученик */}
        <ModalSection 
          icon={<User className="w-5 h-5 text-green-600" />}
          title="Информация об ученике"
        >
            
          {userRole === 'ADMIN' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ученик</label>
                <select
                  id="studentId"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                >
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.fullName} ({student.age} лет)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Стоимость занятия</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    id="cost"
                    name="cost"
                    value={formData.cost}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    placeholder="0.00"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">₸</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <div className="text-lg font-semibold text-gray-900 mb-3">
                {students.find(s => s.id.toString() === formData.studentId)?.fullName || 'Неизвестно'}
              </div>
              <InfoCard
                icon={<DollarSign className="w-5 h-5" />}
                label="Стоимость занятия"
                value={`${formData.cost} ₸`}
              />
            </div>
          )}

          {/* Информация об ученике */}
          {studentInfo && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {studentInfo.diagnosis && (
                <InfoCard
                  icon={<BookOpen className="w-4 h-4" />}
                  label="Диагноз"
                  value={studentInfo.diagnosis}
                />
              )}
              <InfoCard
                icon={<User className="w-4 h-4" />}
                label="Родитель"
                value={studentInfo.parentName}
              />
              <InfoCard
                icon={<Phone className="w-4 h-4" />}
                label="Телефон"
                value={studentInfo.phone}
              />
              {studentInfo.comment && (
                <InfoCard
                  label="Комментарий"
                  value={studentInfo.comment}
                  className="md:col-span-2"
                />
              )}
            </div>
          )}
        </ModalSection>



        {/* Статусы */}
        <ModalSection 
          icon={<CheckCircle className="w-5 h-5 text-purple-600" />}
          title="Статус занятия"
        >
            
          <div className="space-y-4">
            {/* Показываем чекбоксы для проведения и оплаты только админам */}
            {user?.role === 'ADMIN' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center cursor-pointer p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-all duration-200">
                  <input
                    type="checkbox"
                    name="isCompleted"
                    checked={formData.isCompleted}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <div className="ml-3 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full transition-colors duration-200 ${formData.isCompleted ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm font-medium text-gray-700">Проведено</span>
                  </div>
                </label>
                <label className="flex items-center cursor-pointer p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-all duration-200">
                  <input
                    type="checkbox"
                    name="isPaid"
                    checked={formData.isPaid}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="ml-3 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full transition-colors duration-200 ${formData.isPaid ? 'bg-green-500' : 'bg-orange-400'}`}></div>
                    <span className="text-sm font-medium text-gray-700">Оплачено</span>
                  </div>
                </label>
              </div>
            )}
              
            {/* Для обычных пользователей показываем статусы только для чтения */}
            {userRole === 'USER' && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <LessonStatusGroup
                  isCompleted={formData.isCompleted}
                  isPaid={formData.isPaid}
                  isCancelled={formData.isCancelled}
                  showLabels={true}
                />
              </div>
            )}
              
            {/* Чекбокс отмены доступен всем пользователям */}
            <div className="mt-4">
              <label className="flex items-center cursor-pointer p-4 bg-red-50/50 rounded-xl border border-red-200 hover:bg-red-50 transition-all duration-200">
                <input
                  type="checkbox"
                  name="isCancelled"
                  checked={formData.isCancelled}
                  onChange={handleChange}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <div className="ml-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className={`text-sm font-medium ${formData.isCancelled ? 'text-red-600' : 'text-gray-700'}`}>
                    {userRole === 'USER' ? 'Отменить занятие' : 'Отменено'}
                  </span>
                </div>
              </label>
              {formData.isCancelled && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Занятие будет отменено. Это действие можно будет отменить до сохранения.</span>
                </div>
              )}
            </div>
          </div>
        </ModalSection>

        {/* Заметки и комментарии */}
        <ModalSection 
          icon={<FileText className="w-5 h-5 text-indigo-600" />}
          title="Заметки и комментарии"
        >
            
          <div className="space-y-4">
            {/* Заметки */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Заметки о занятии</label>
              {userRole === 'ADMIN' ? (
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white resize-none"
                  placeholder="Добавьте заметки о занятии..."
                />
              ) : (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  {formData.notes ? (
                    <p className="text-gray-900 whitespace-pre-wrap">{formData.notes}</p>
                  ) : (
                    <p className="text-gray-500 italic">Заметки не добавлены</p>
                  )}
                </div>
              )}
            </div>

            {/* Комментарий о поведении ребенка - только для прошедших занятий */}
            {new Date(lesson.date) < new Date() && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                  Комментарий о поведении ребенка
                </label>
                {userRole === 'ADMIN' ? (
                  <textarea
                    id="comment"
                    name="comment"
                    value={formData.comment}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white resize-none"
                    placeholder="Опишите поведение ребенка на занятии..."
                  />
                ) : (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    {formData.comment ? (
                      <p className="text-gray-900 whitespace-pre-wrap">{formData.comment}</p>
                    ) : (
                      <p className="text-gray-500 italic">Комментарий не добавлен</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </ModalSection>

        {/* Кнопка удаления для админа */}
        {userRole === 'ADMIN' && (
          <div className="mx-6 mb-4">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteLoading}
              className="w-full px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-red-200"
            >
              <Trash2 className="w-4 h-4" />
              {deleteLoading ? 'Удаление...' : 'Удалить занятие'}
            </button>
          </div>
        )}
      </form>
      <ConfirmDialogComponent />
    </Modal>
  );
}
