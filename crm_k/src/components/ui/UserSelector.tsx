'use client';

import { useState, useEffect } from 'react';
import { User, ChevronDown, Search, Check } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  _count?: {
    students: number;
  };
}

interface UserSelectorProps {
  selectedUserId?: number;
  onUserChange: (userId: number | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showUserCount?: boolean;
}

export default function UserSelector({
  selectedUserId,
  onUserChange,
  placeholder = "Выберите пользователя...",
  className = "",
  disabled = false,
  showUserCount = false
}: UserSelectorProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Загружаем пользователей
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await apiRequest('/api/admin/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        } else {
          setError('Ошибка при загрузке пользователей');
        }
      } catch (err) {
        setError('Ошибка при загрузке пользователей');
        console.error('Ошибка загрузки пользователей:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Фильтруем пользователей по поисковому запросу
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Находим выбранного пользователя
  const selectedUser = users.find(user => user.id === selectedUserId);

  const handleUserSelect = (user: User) => {
    onUserChange(user.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onUserChange(null);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Поле ввода */}
      <div
        className={`
          w-full px-3 py-2 border rounded-lg cursor-pointer
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-blue-300'}
          ${isOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300'}
          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
          transition-all duration-200
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {selectedUser ? (
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-900 truncate">
                    {selectedUser.name}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {selectedUser.role === 'ADMIN' ? 'Админ' : 'Учитель'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {selectedUser.email}
                </div>
                {showUserCount && selectedUser._count && (
                  <div className="text-xs text-blue-600">
                    Учеников: {selectedUser._count.students}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-gray-500 truncate">
                {placeholder}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {selectedUser && !disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
            <ChevronDown 
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`} 
            />
          </div>
        </div>
      </div>

      {/* Выпадающий список */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Поиск */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск пользователя..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Список пользователей */}
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm">Загрузка...</p>
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">
                <p className="text-sm">{error}</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">
                  {searchTerm ? 'Пользователи не найдены' : 'Нет доступных пользователей'}
                </p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className={`
                    p-3 hover:bg-blue-50 cursor-pointer transition-colors duration-150
                    ${selectedUserId === user.id ? 'bg-blue-50' : ''}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {user.name}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {user.role === 'ADMIN' ? 'Админ' : 'Учитель'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {user.email}
                      </div>
                      {showUserCount && user._count && (
                        <div className="text-xs text-blue-600">
                          Учеников: {user._count.students}
                        </div>
                      )}
                    </div>
                    {selectedUserId === user.id && (
                      <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Обработка клика вне компонента */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
