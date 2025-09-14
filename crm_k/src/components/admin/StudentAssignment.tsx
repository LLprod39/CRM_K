'use client'

import { useState, useEffect } from 'react'
import { User, Student, UserRole } from '../../types'
import { apiRequest } from '../../lib/api'
import UserSelector from '../ui/UserSelector'
import { 
  Users, 
  UserCheck, 
  UserX, 
  AlertCircle, 
  CheckCircle,
  RefreshCw,
  Search,
  Filter,
  Plus,
  CreditCard,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import AddStudentForm from '../forms/AddStudentForm'
import StudentBalanceCard from './StudentBalanceCard'

interface StudentWithUser extends Student {
  user?: {
    name: string
    email: string
  } | null
  isAssigned?: boolean
}

export default function StudentAssignment() {
  const [students, setStudents] = useState<StudentWithUser[]>([])
  const [teachers, setTeachers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'unassigned'>('all')
  const [showAddStudentForm, setShowAddStudentForm] = useState(false)
  const [selectedStudentForBalance, setSelectedStudentForBalance] = useState<number | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [studentsResponse, teachersResponse] = await Promise.all([
        apiRequest('/api/students'),
        apiRequest('/api/admin/teachers')
      ])

      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json()
        setStudents(studentsData)
      }

      if (teachersResponse.ok) {
        const teachersData = await teachersResponse.json()
        setTeachers(teachersData)
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignStudent = async (studentId: number, teacherId: number) => {
    setAssigning(true)
    try {
      const response = await apiRequest('/api/students/assign', {
        method: 'POST',
        body: JSON.stringify({ studentId, teacherId })
      })

      if (response.ok) {
        await fetchData() // Обновляем данные
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Ошибка при назначении ученика')
      }
    } catch (error) {
      console.error('Ошибка при назначении ученика:', error)
      alert('Ошибка при назначении ученика')
    } finally {
      setAssigning(false)
    }
  }

  const handleUnassignStudent = async (studentId: number) => {
    setAssigning(true)
    try {
      const response = await apiRequest('/api/students/assign', {
        method: 'DELETE',
        body: JSON.stringify({ studentId })
      })

      if (response.ok) {
        await fetchData() // Обновляем данные
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Ошибка при отмене назначения')
      }
    } catch (error) {
      console.error('Ошибка при отмене назначения:', error)
      alert('Ошибка при отмене назначения')
    } finally {
      setAssigning(false)
    }
  }

  // Фильтрация учеников
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.parentName.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'assigned' && student.isAssigned) ||
                         (filterStatus === 'unassigned' && !student.isAssigned)
    
    return matchesSearch && matchesFilter
  })

  const assignedCount = students.filter(s => s.isAssigned).length
  const unassignedCount = students.filter(s => !s.isAssigned).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Загрузка...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Заголовок и действия */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Ученики</h2>
            <p className="text-sm text-gray-600 mt-1">
              Всего: {students.length} • Назначены: {assignedCount} • Не назначены: {unassignedCount}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddStudentForm(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center text-sm font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить ученика
            </button>
            <button
              onClick={fetchData}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Обновить данные"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Фильтры */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по имени ученика или родителя..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Все ученики</option>
              <option value="assigned">Назначенные</option>
              <option value="unassigned">Не назначенные</option>
            </select>
          </div>
        </div>
      </div>

      {/* Таблица учеников */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          {filteredStudents.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ФИО</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Назначен(ы) учителю(ям)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Баланс</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Последнее занятие</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <UserCheck className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                          <div className="text-xs text-gray-500">{student.parentName} • {student.age} лет</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.isAssigned && student.user ? (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{student.user.name}</div>
                            <div className="text-xs text-gray-500">{student.user.email}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                          <span className="text-sm text-gray-500">Не назначен</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                        <span className={`text-sm font-medium ${
                          (student.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {student.balance ? student.balance.toLocaleString() : '0'} ₸
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.lastLessonDate ? new Date(student.lastLessonDate).toLocaleDateString('ru-RU') : 'Нет занятий'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedStudentForBalance(student.id)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Баланс"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                        
                        {!student.isAssigned ? (
                          <UserSelector
                            selectedUserId={undefined}
                            onUserChange={(teacherId) => {
                              if (teacherId) {
                                handleAssignStudent(student.id, teacherId)
                              }
                            }}
                            placeholder="Назначить..."
                            className="min-w-[150px]"
                          />
                        ) : (
                          <button
                            onClick={() => handleUnassignStudent(student.id)}
                            disabled={assigning}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Отменить назначение"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || filterStatus !== 'all' ? 'Ученики не найдены' : 'Нет учеников'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Попробуйте изменить параметры поиска' 
                  : 'Добавьте первого ученика, чтобы начать работу'
                }
              </p>
              {searchQuery || filterStatus !== 'all' ? (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setFilterStatus('all')
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                >
                  Сбросить фильтры
                </button>
              ) : (
                <button
                  onClick={() => setShowAddStudentForm(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                >
                  Добавить ученика
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Форма добавления ученика */}
      <AddStudentForm
        isOpen={showAddStudentForm}
        onClose={() => setShowAddStudentForm(false)}
        onSuccess={() => {
          setShowAddStudentForm(false)
          fetchData() // Обновляем данные после создания ученика
        }}
      />

      {/* Модальное окно с балансом ученика */}
      {selectedStudentForBalance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Баланс ученика
                </h2>
                <button
                  onClick={() => setSelectedStudentForBalance(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <UserX className="w-6 h-6" />
                </button>
              </div>
              
              <StudentBalanceCard
                studentId={selectedStudentForBalance}
                studentName={students.find(s => s.id === selectedStudentForBalance)?.fullName || 'Неизвестный ученик'}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
