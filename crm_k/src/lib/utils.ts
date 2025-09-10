import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Форматирование даты
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

// Форматирование времени
export function formatTime(time: string): string {
  return time;
}

// Форматирование валюты
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'KZT'
  }).format(amount);
}

// Валидация телефона
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^(\+7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
  return phoneRegex.test(phone);
}

// Валидация email
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Генерация уникального ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Очистка номера телефона
export function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

// Форматирование номера телефона для отображения
export function formatPhone(phone: string): string {
  const cleaned = cleanPhone(phone);
  if (cleaned.length === 11) {
    return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9)}`;
  }
  return phone;
}
