'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, Search, Edit, Trash2, Printer, X } from 'lucide-react';
import { Student } from '@/types';
import AddStudentForm from '@/components/forms/AddStudentForm';
import EditStudentForm from '@/components/forms/EditStudentForm';
import { printStudentsList } from '@/lib/print';
import { apiRequest } from '@/lib/api';

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  const [diagnosisFilter, setDiagnosisFilter] = useState('');
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Загрузка учеников
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await apiRequest('/api/students');
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      } else {
        console.error('Ошибка при загрузке учеников');
      }
    } catch (error) {
      console.error('Ошибка при загрузке учеников:', error);
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация учеников
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.phone.includes(searchTerm);
    
    const matchesAge = !ageFilter || (
      ageFilter === '3-6' && student.age >= 3 && student.age <= 6 ||
      ageFilter === '7-12' && student.age >= 7 && student.age <= 12 ||
      ageFilter === '13-18' && student.age >= 13 && student.age <= 18
    );
    
    const matchesDiagnosis = !diagnosisFilter || 
      (student.diagnosis && student.diagnosis.toLowerCase().includes(diagnosisFilter.toLowerCase()));

    return matchesSearch && matchesAge && matchesDiagnosis;
  });

  // Удаление ученика
  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого ученика?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setStudents(students.filter(student => student.id !== id));
      } else {
        alert('Ошибка при удалении ученика');
      }
    } catch (error) {
      console.error('Ошибка при удалении ученика:', error);
      alert('Ошибка при удалении ученика');
    }
  };

  // Обработка успешного добавления ученика
  const handleAddSuccess = () => {
    fetchStudents(); // Перезагружаем список
  };

  // Обработка успешного редактирования ученика
  const handleEditSuccess = () => {
    fetchStudents(); // Перезагружаем список
  };

  // Открытие формы редактирования
  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setIsEditFormOpen(true);
  };

  // Переход к профилю ученика
  const handleView = (student: Student) => {
    router.push(`/students/${student.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и действия */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="animate-fade-in">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center">
            <Users className="w-8 h-8 text-blue-600 mr-3" />
            Ученики
          </h1>
          <p className="mt-2 text-gray-600 text-lg">
            Управление базой данных учеников ({filteredStudents.length} из {students.length})
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3 animate-scale-in">
          <button 
            onClick={() => printStudentsList(filteredStudents)}
            className="inline-flex items-center px-4 py-3 border border-gray-300 rounded-xl shadow-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:scale-105 hover:shadow-xl"
          >
            <Printer className="w-5 h-5 mr-2" />
            Печать
          </button>
          <button 
            onClick={() => setIsAddFormOpen(true)}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:scale-105 hover:shadow-xl"
          >
            <Plus className="w-5 h-5 mr-2" />
            Добавить ученика
          </button>
        </div>
      </div>

      {/* Поиск и фильтры */}
      <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-200/50 animate-fade-in">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Поиск по имени, фамилии или телефону..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 focus:bg-white text-gray-900 placeholder-gray-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select 
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 focus:bg-white text-gray-900"
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
            >
              <option value="">Все возрасты</option>
              <option value="3-6">3-6 лет</option>
              <option value="7-12">7-12 лет</option>
              <option value="13-18">13-18 лет</option>
            </select>
            <select 
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 focus:bg-white text-gray-900"
              value={diagnosisFilter}
              onChange={(e) => setDiagnosisFilter(e.target.value)}
            >
              <option value="">Все диагнозы</option>
              <option value="аутизм">Аутизм</option>
              <option value="зпр">ЗПР</option>
              <option value="дцп">ДЦП</option>
            </select>
          </div>
        </div>
      </div>

      {/* Таблица учеников */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 animate-fade-in">
        <div className="px-6 py-5 border-b border-gray-200/50">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Users className="w-6 h-6 text-blue-600 mr-2" />
            Список учеников
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200/50">
            <thead className="bg-gradient-to-r from-gray-50/80 to-gray-100/40">
              <tr>
                <th className="px-6 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Ученик
                </th>
                <th className="px-6 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Контакты
                </th>
                <th className="px-6 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Возраст
                </th>
                <th className="px-6 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Диагноз
                </th>
                <th className="px-6 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200/50">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <Users className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {students.length === 0 ? 'Нет учеников' : 'Ученики не найдены'}
                    </h3>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">
                      {students.length === 0 
                        ? 'Начните с добавления первого ученика в систему.'
                        : 'Попробуйте изменить параметры поиска или фильтры.'
                      }
                    </p>
                    {students.length === 0 && (
                      <button 
                        onClick={() => setIsAddFormOpen(true)}
                        className="inline-flex items-center px-8 py-4 border border-transparent shadow-lg text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 hover:scale-105 hover:shadow-xl"
                      >
                        <Plus className="w-6 h-6 mr-3" />
                        Добавить первого ученика
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => (
                  <tr 
                    key={student.id} 
                    className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-transparent transition-all duration-300 group animate-fade-in cursor-pointer border-b border-gray-100/50"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => handleView(student)}
                  >
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex items-center space-x-4">
                        {student.photoUrl ? (
                          <div className="relative">
                            <img
                              src={student.photoUrl}
                              alt={student.fullName}
                              className="w-12 h-12 rounded-full object-cover group-hover:scale-105 transition-transform duration-300 border-2 border-gray-100 shadow-sm"
                            />
                            <div className="absolute inset-0 rounded-full bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm group-hover:scale-105 transition-transform duration-300 shadow-sm">
                            {student.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                            {student.fullName}
                          </div>
                          {student.comment && (
                            <div className="text-sm text-gray-500 truncate max-w-xs mt-1">
                              {student.comment}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                        {student.phone}
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                        {student.age} лет
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      {student.diagnosis ? (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200">
                          {student.diagnosis}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400 italic">—</span>
                      )}
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEdit(student)}
                          className="p-2.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-sm border border-transparent hover:border-indigo-200"
                          title="Редактировать"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-sm border border-transparent hover:border-red-200"
                          title="Удалить"
                          onClick={() => handleDelete(student.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Форма добавления ученика */}
      <AddStudentForm
        isOpen={isAddFormOpen}
        onClose={() => setIsAddFormOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Форма редактирования ученика */}
      <EditStudentForm
        isOpen={isEditFormOpen}
        onClose={() => {
          setIsEditFormOpen(false);
          setSelectedStudent(null);
        }}
        onSuccess={handleEditSuccess}
        student={selectedStudent}
      />

    </div>
  );
}
