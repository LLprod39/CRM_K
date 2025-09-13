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
    <div className="space-y-6">
      {/* Заголовок и статистика */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Назначение учеников
              </h2>
              <p className="text-sm text-gray-600">
                Управление назначением учеников учителям
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddStudentForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить ученика</span>
            </button>
            <button
              onClick={fetchData}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Обновить данные"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Всего учеников</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {students.length}
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">Назначены</span>
            </div>
            <div className="text-2xl font-bold text-green-900 mt-1">
              {assignedCount}
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <UserX className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">Не назначены</span>
            </div>
            <div className="text-2xl font-bold text-orange-900 mt-1">
              {unassignedCount}
            </div>
          </div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по имени ученика или родителя..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Все ученики</option>
              <option value="assigned">Назначенные</option>
              <option value="unassigned">Не назначенные</option>
            </select>
          </div>
        </div>
      </div>

      {/* Список учеников */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Список учеников ({filteredStudents.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <div key={student.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {student.fullName}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Родитель: {student.parentName} • Возраст: {student.age} лет
                        </p>
                        <p className="text-sm text-gray-500">
                          Телефон: {student.phone}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {student.isAssigned ? (
                          <div className="flex items-center space-x-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Назначен</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-orange-600">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Не назначен</span>
                          </div>
                        )}
                        
                        {/* Баланс ученика */}
                        <div className="flex items-center space-x-1">
                          <CreditCard className="w-4 h-4 text-blue-600" />
                          <span className={`text-sm font-medium ${
                            (student.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {student.balance ? student.balance.toLocaleString() : '0'} ₸
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {student.user && (
                      <div className="mt-2 text-sm text-blue-600">
                        Учитель: {student.user.name} ({student.user.email})
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedStudentForBalance(student.id)}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-1"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Баланс</span>
                    </button>
                    
                    {!student.isAssigned ? (
                      <div className="flex items-center space-x-2">
                        <UserSelector
                          selectedUserId={undefined}
                          onUserChange={(teacherId) => {
                            if (teacherId) {
                              handleAssignStudent(student.id, teacherId)
                            }
                          }}
                          placeholder="Выберите учителя..."
                          className="min-w-[200px]"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUnassignStudent(student.id)}
                        disabled={assigning}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Отменить назначение
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ученики не найдены
              </h3>
              <p className="text-gray-600">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Попробуйте изменить параметры поиска'
                  : 'Нет учеников для отображения'
                }
              </p>
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
