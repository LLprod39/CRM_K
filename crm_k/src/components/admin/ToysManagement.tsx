'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { useToast } from '@/presentation/hooks';

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
  const { showToast } = useToast();

  // Форма для новой игрушки
  const [newToy, setNewToy] = useState({
    name: '',
    description: '',
    category: ''
  });

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

  if (loading) {
    return <div className="p-6">Загрузка...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Управление игрушками</h2>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Добавить игрушку
        </Button>
      </div>

      {/* Форма добавления */}
      {showAddForm && (
        <Card className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-4">Добавить новую игрушку</h3>
          <form onSubmit={handleAddToy} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Название *</label>
              <Input
                value={newToy.name}
                onChange={(e) => setNewToy({ ...newToy, name: e.target.value })}
                placeholder="Название игрушки"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Описание</label>
              <Input
                value={newToy.description}
                onChange={(e) => setNewToy({ ...newToy, description: e.target.value })}
                placeholder="Описание игрушки"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Категория</label>
              <Input
                value={newToy.category}
                onChange={(e) => setNewToy({ ...newToy, category: e.target.value })}
                placeholder="Например: развивающие, сенсорные, моторные"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Добавить
              </Button>
              <Button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className="bg-gray-600 hover:bg-gray-700"
              >
                Отмена
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Список игрушек */}
      <div className="grid gap-4 sm:gap-6">
        {toys.map((toy) => (
          <Card key={toy.id} className="p-4 sm:p-6">
            {editingToy?.id === toy.id ? (
              <div className="space-y-3">
                <Input
                  value={editingToy.name}
                  onChange={(e) => setEditingToy({ ...editingToy, name: e.target.value })}
                  placeholder="Название"
                />
                <Input
                  value={editingToy.description || ''}
                  onChange={(e) => setEditingToy({ ...editingToy, description: e.target.value })}
                  placeholder="Описание"
                />
                <Input
                  value={editingToy.category || ''}
                  onChange={(e) => setEditingToy({ ...editingToy, category: e.target.value })}
                  placeholder="Категория"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`available-${toy.id}`}
                    checked={editingToy.isAvailable}
                    onChange={(e) => setEditingToy({ ...editingToy, isAvailable: e.target.checked })}
                  />
                  <label htmlFor={`available-${toy.id}`} className="text-sm">
                    Доступна
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleUpdateToy(editingToy)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Сохранить
                  </Button>
                  <Button 
                    onClick={() => setEditingToy(null)}
                    className="bg-gray-600 hover:bg-gray-700"
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{toy.name}</h3>
                  {toy.description && (
                    <p className="text-gray-600 mt-1">{toy.description}</p>
                  )}
                  {toy.category && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-2">
                      {toy.category}
                    </span>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      toy.isAvailable 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {toy.isAvailable ? 'Доступна' : 'Недоступна'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setEditingToy(toy)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Редактировать
                  </Button>
                  <Button 
                    onClick={() => handleDeleteToy(toy.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Удалить
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {toys.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Игрушки не добавлены
        </div>
      )}
    </div>
  );
}
