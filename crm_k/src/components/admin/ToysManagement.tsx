'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { useToast } from '@/presentation/hooks';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  X, 
  Check, 
  Target,
  Gamepad2,
  Puzzle,
  Heart,
  Star,
  Zap,
  Sparkles,
  Package,
  Eye,
  EyeOff,
  Brain,
  Gift
} from 'lucide-react';

interface Toy {
  id: number;
  name: string;
  description?: string;
  category?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ToysManagement() {
  const [toys, setToys] = useState<Toy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingToy, setEditingToy] = useState<Toy | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterAvailability, setFilterAvailability] = useState('all');
  const { showToast } = useToast();

  // Форма для новой игрушки
  const [newToy, setNewToy] = useState({
    name: '',
    description: '',
    category: ''
  });

  // Категории игрушек с иконками
  const toyCategories = [
    { value: 'развивающие', label: 'Развивающие', icon: Brain, color: 'blue' },
    { value: 'сенсорные', label: 'Сенсорные', icon: Heart, color: 'pink' },
    { value: 'моторные', label: 'Моторные', icon: Zap, color: 'green' },
    { value: 'творческие', label: 'Творческие', icon: Sparkles, color: 'purple' },
    { value: 'логические', label: 'Логические', icon: Puzzle, color: 'orange' },
    { value: 'социальные', label: 'Социальные', icon: Star, color: 'yellow' },
    { value: 'другие', label: 'Другие', icon: Package, color: 'gray' }
  ];

  // Получение иконки для категории
  const getCategoryIcon = (category: string) => {
    const categoryData = toyCategories.find(cat => cat.value === category);
    return categoryData ? categoryData.icon : Package;
  };

  // Получение цвета для категории
  const getCategoryColor = (category: string) => {
    const categoryData = toyCategories.find(cat => cat.value === category);
    return categoryData ? categoryData.color : 'gray';
  };

  // Загрузка игрушек
  const fetchToys = async () => {
    try {
      const response = await fetch('/api/admin/toys');
      if (response.ok) {
        const data = await response.json();
        setToys(data);
      } else {
        showToast('Ошибка при загрузке игрушек', 'error');
      }
    } catch (error) {
      showToast('Ошибка при загрузке игрушек', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToys();
  }, []);

  // Добавление новой игрушки
  const handleAddToy = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/toys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newToy)
      });

      if (response.ok) {
        showToast('Игрушка добавлена', 'success');
        setNewToy({ name: '', description: '', category: '' });
        setShowAddForm(false);
        fetchToys();
      } else {
        showToast('Ошибка при добавлении игрушки', 'error');
      }
    } catch (error) {
      showToast('Ошибка при добавлении игрушки', 'error');
    }
  };

  // Обновление игрушки
  const handleUpdateToy = async (toy: Toy) => {
    try {
      const response = await fetch(`/api/admin/toys/${toy.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toy)
      });

      if (response.ok) {
        showToast('Игрушка обновлена', 'success');
        setEditingToy(null);
        fetchToys();
      } else {
        showToast('Ошибка при обновлении игрушки', 'error');
      }
    } catch (error) {
      showToast('Ошибка при обновлении игрушки', 'error');
    }
  };

  // Удаление игрушки
  const handleDeleteToy = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту игрушку?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/toys/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showToast('Игрушка удалена', 'success');
        fetchToys();
      } else {
        showToast('Ошибка при удалении игрушки', 'error');
      }
    } catch (error) {
      showToast('Ошибка при удалении игрушки', 'error');
    }
  };

  // Фильтрация игрушек
  const filteredToys = toys.filter(toy => {
    const matchesSearch = searchQuery === '' || 
      toy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (toy.description && toy.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || toy.category === filterCategory;
    
    const matchesAvailability = filterAvailability === 'all' || 
      (filterAvailability === 'available' && toy.isAvailable) ||
      (filterAvailability === 'unavailable' && !toy.isAvailable);
    
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  // Получение цветовых классов для категорий
  const getCategoryColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      pink: 'bg-pink-50 text-pink-700 border-pink-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      orange: 'bg-orange-50 text-orange-700 border-orange-200',
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      gray: 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <div className="text-lg font-medium text-gray-900 mb-2">Загрузка игрушек</div>
          <div className="text-gray-600">Получение данных из базы...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Заголовок и статистика */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Управление игрушками</h2>
              <p className="text-gray-600 mt-1">Всего игрушек: {toys.length} • Доступно: {toys.filter(t => t.isAvailable).length}</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить игрушку</span>
          </Button>
        </div>

        {/* Поиск и фильтры */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск игрушек..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-gray-50"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-gray-50"
          >
            <option value="all">Все категории</option>
            {toyCategories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          <select
            value={filterAvailability}
            onChange={(e) => setFilterAvailability(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-gray-50"
          >
            <option value="all">Все статусы</option>
            <option value="available">Доступные</option>
            <option value="unavailable">Недоступные</option>
          </select>
        </div>
      </div>

      {/* Форма добавления */}
      {showAddForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-pink-500" />
              Добавить новую игрушку
            </h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleAddToy} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Название *</label>
                <Input
                  value={newToy.name}
                  onChange={(e) => setNewToy({ ...newToy, name: e.target.value })}
                  placeholder="Название игрушки"
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Категория</label>
                <select
                  value={newToy.category}
                  onChange={(e) => setNewToy({ ...newToy, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-gray-50"
                >
                  <option value="">Выберите категорию</option>
                  {toyCategories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
              <textarea
                value={newToy.description}
                onChange={(e) => setNewToy({ ...newToy, description: e.target.value })}
                placeholder="Описание игрушки..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-gray-50 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white flex items-center space-x-2">
                <Check className="w-4 h-4" />
                <span>Добавить игрушку</span>
              </Button>
              <Button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
              >
                Отмена
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Список игрушек */}
      {filteredToys.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredToys.map((toy) => {
            const CategoryIcon = getCategoryIcon(toy.category || '');
            const categoryColor = getCategoryColor(toy.category || '');
            const colorClasses = getCategoryColorClasses(categoryColor);
            
            return (
              <div key={toy.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden group">
                {editingToy?.id === toy.id ? (
                  <div className="p-6 space-y-4">
                    <Input
                      value={editingToy.name}
                      onChange={(e) => setEditingToy({ ...editingToy, name: e.target.value })}
                      placeholder="Название"
                      className="w-full"
                    />
                    <textarea
                      value={editingToy.description || ''}
                      onChange={(e) => setEditingToy({ ...editingToy, description: e.target.value })}
                      placeholder="Описание"
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-gray-50 resize-none"
                    />
                    <select
                      value={editingToy.category || ''}
                      onChange={(e) => setEditingToy({ ...editingToy, category: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-gray-50"
                    >
                      <option value="">Выберите категорию</option>
                      {toyCategories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`available-${toy.id}`}
                        checked={editingToy.isAvailable}
                        onChange={(e) => setEditingToy({ ...editingToy, isAvailable: e.target.checked })}
                        className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                      />
                      <label htmlFor={`available-${toy.id}`} className="text-sm text-gray-700">
                        Доступна
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleUpdateToy(editingToy)}
                        className="bg-green-600 hover:bg-green-700 text-white flex-1"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Сохранить
                      </Button>
                      <Button 
                        onClick={() => setEditingToy(null)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClasses}`}>
                            <CategoryIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg text-gray-900 truncate">{toy.name}</h3>
                            {toy.category && (
                              <span className={`inline-block text-xs px-2 py-1 rounded-lg border ${colorClasses} mt-1`}>
                                {toyCategories.find(cat => cat.value === toy.category)?.label || toy.category}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                          <button
                            onClick={() => setEditingToy(toy)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Редактировать"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteToy(toy.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Удалить"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {toy.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{toy.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between gap-2">
                        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                          toy.isAvailable 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {toy.isAvailable ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span className="whitespace-nowrap">{toy.isAvailable ? 'Доступна' : 'Недоступна'}</span>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {new Date(toy.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Gift className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || filterCategory !== 'all' || filterAvailability !== 'all' 
              ? 'Игрушки не найдены' 
              : 'Игрушки не добавлены'
            }
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || filterCategory !== 'all' || filterAvailability !== 'all'
              ? 'Попробуйте изменить параметры поиска или фильтры'
              : 'Добавьте первую игрушку, чтобы начать работу'
            }
          </p>
          {searchQuery || filterCategory !== 'all' || filterAvailability !== 'all' ? (
            <Button
              onClick={() => {
                setSearchQuery('');
                setFilterCategory('all');
                setFilterAvailability('all');
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              Сбросить фильтры
            </Button>
          ) : (
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить первую игрушку
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
