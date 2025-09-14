'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, User, Check } from 'lucide-react';
import { Student } from '@/types';

interface StudentSearchProps {
  students: Student[];
  selectedStudents: Student[];
  onSelectionChange: (students: Student[]) => void;
  placeholder?: string;
  multiple?: boolean;
  className?: string;
  disabled?: boolean;
}

export default function StudentSearch({
  students,
  selectedStudents,
  onSelectionChange,
  placeholder = "Поиск ученика...",
  multiple = false,
  className = "",
  disabled = false
}: StudentSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Фильтрация учеников по поисковому запросу
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student =>
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.phone.includes(searchTerm)
      );
      setFilteredStudents(filtered);
    }
  }, [searchTerm, students]);

  // Обработка клика вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleStudentSelect = (student: Student) => {
    if (multiple) {
      const isSelected = selectedStudents.some(s => s.id === student.id);
      if (isSelected) {
        // Убираем ученика из выбранных
        onSelectionChange(selectedStudents.filter(s => s.id !== student.id));
      } else {
        // Добавляем ученика к выбранным
        onSelectionChange([...selectedStudents, student]);
      }
    } else {
      // Одиночный выбор
      onSelectionChange([student]);
      setSearchTerm(student.fullName);
      setIsOpen(false);
    }
  };

  const handleRemoveStudent = (studentId: number) => {
    onSelectionChange(selectedStudents.filter(s => s.id !== studentId));
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const isStudentSelected = (student: Student) => {
    return selectedStudents.some(s => s.id === student.id);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Поле ввода */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Выпадающий список */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredStudents.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              {searchTerm ? 'Ученики не найдены' : 'Нет доступных учеников'}
            </div>
          ) : (
            <div className="py-1">
              {filteredStudents.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => handleStudentSelect(student)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between ${
                    isStudentSelected(student) ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {student.photoUrl ? (
                        <img
                          src={student.photoUrl}
                          alt={student.fullName}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {student.fullName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {student.age} лет • {student.parentName}
                      </p>
                    </div>
                  </div>
                  {isStudentSelected(student) && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Выбранные ученики (для множественного выбора) */}
      {multiple && selectedStudents.length > 0 && (
        <div className="mt-2 space-y-1">
          {selectedStudents.map((student) => (
            <div
              key={student.id}
              className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md px-3 py-2"
            >
              <div className="flex items-center space-x-2">
                {student.photoUrl ? (
                  <img
                    src={student.photoUrl}
                    alt={student.fullName}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-3 w-3 text-gray-500" />
                  </div>
                )}
                <span className="text-sm font-medium text-gray-900">
                  {student.fullName}
                </span>
                <span className="text-xs text-gray-500">
                  ({student.age} лет)
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveStudent(student.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
