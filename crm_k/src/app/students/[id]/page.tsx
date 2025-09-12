'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, AlertCircle, User, Phone, MessageSquare, CheckCircle, DollarSign } from 'lucide-react';
import { StudentWithLessons, Lesson, getLessonStatus, getLessonStatusText } from '@/types';
import { apiRequest } from '@/lib/api';
import LessonSuggestions from '@/components/LessonSuggestions';
import Card from '@/components/ui/Card';

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<StudentWithLessons | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchStudent();
    }
  }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStudent = async () => {
    try {
      const response = await apiRequest(`/api/students/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setStudent(data);
      } else if (response.status === 404) {
        setError('Ученик не найден');
      } else {
        setError('Ошибка при загрузке данных ученика');
      }
    } catch (error) {
      console.error('Ошибка при загрузке ученика:', error);
      setError('Ошибка при загрузке данных ученика');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (lesson: Lesson) => {
    // Иконки убраны для минималистичного дизайна
    return null;
  };

  const getStatusText = (lesson: Lesson) => {
    return getLessonStatusText(getLessonStatus(lesson));
  };

  const getStatusColor = (lesson: Lesson) => {
    const status = getLessonStatus(lesson);
    switch (status) {
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      case 'prepaid':
        return 'bg-purple-100 text-purple-800';
      case 'unpaid':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateStats = () => {
    if (!student?.lessons) return { total: 0, completed: 0, totalCost: 0, paidCost: 0 };

    const total = student.lessons.length;
    const completed = student.lessons.filter(lesson => lesson.isCompleted).length;
    const totalCost = student.lessons.reduce((sum, lesson) => sum + lesson.cost, 0);
    const paidCost = student.lessons
      .filter(lesson => lesson.isPaid)
      .reduce((sum, lesson) => sum + lesson.cost, 0);

    return { total, completed, totalCost, paidCost };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Ошибка</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <div className="mt-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </button>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center space-x-4">
          {student.photoUrl ? (
            <img
              src={student.photoUrl}
              alt={student.fullName}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
              {student.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{student.fullName}</h1>
            <p className="mt-1 text-gray-600">Профиль ученика</p>
          </div>
        </div>
      </div>

      {/* Основная информация */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Основная информация</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">ФИО Родителя</p>
                  <p className="text-sm text-gray-900">{student.parentName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Телефон</p>
                  <p className="text-sm text-gray-900">{student.phone}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Возраст</p>
                  <p className="text-sm text-gray-900">{student.age} лет</p>
                </div>
              </div>
              {student.diagnosis && (
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Диагноз</p>
                    <p className="text-sm text-gray-900">{student.diagnosis}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-start space-x-3">
              <MessageSquare className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Комментарий</p>
                {student.comment ? (
                  <p className="text-sm text-gray-900 mt-1 bg-gray-50 p-3 rounded-lg border">
                    {student.comment}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic mt-1">
                    Комментарий не добавлен
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Статистика занятий */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Всего занятий</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Проведено</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Общая стоимость</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalCost.toLocaleString()} ₸</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Оплачено</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.paidCost.toLocaleString()} ₸</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Предложения занятий от ИИ */}
      <LessonSuggestions studentId={student.id} />

      {/* История занятий */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">История занятий</h2>
        </div>
        <div className="overflow-x-auto">
          {student.lessons && student.lessons.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата и время
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Стоимость
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Заметки
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {student.lessons.map((lesson) => (
                  <tr key={lesson.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(lesson.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lesson.cost.toLocaleString()} ₸
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lesson)}`}>
                        {getStatusIcon(lesson)}
                        <span className="ml-1">{getStatusText(lesson)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {lesson.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-12 text-center">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Нет занятий</h3>
              <p className="mt-1 text-sm text-gray-500">
                У этого ученика пока нет запланированных занятий.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
