/**
 * Утилиты для работы с временем
 */

/**
 * Безопасно форматирует время в локальном формате
 * @param time - время в виде строки или Date объекта
 * @param options - опции форматирования
 * @returns отформатированная строка времени
 */
export function formatTime(
  time: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
): string {
  if (!time) return '';
  
  try {
    const date = typeof time === 'string' ? new Date(time) : time;
    
    // Проверяем, что дата валидна
    if (isNaN(date.getTime())) {
      console.warn('Invalid date provided to formatTime:', time);
      return '';
    }
    
    return date.toLocaleTimeString('ru-RU', options);
  } catch (error) {
    console.error('Error formatting time:', error, time);
    return '';
  }
}

/**
 * Безопасно форматирует дату в локальном формате
 * @param date - дата в виде строки или Date объекта
 * @param options - опции форматирования
 * @returns отформатированная строка даты
 */
export function formatDate(
  date: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric',
    weekday: 'long'
  }
): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Проверяем, что дата валидна
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to formatDate:', date);
      return '';
    }
    
    return dateObj.toLocaleDateString('ru-RU', options);
  } catch (error) {
    console.error('Error formatting date:', error, date);
    return '';
  }
}

/**
 * Вычисляет продолжительность между двумя временными точками
 * @param startTime - время начала
 * @param endTime - время окончания
 * @returns продолжительность в минутах
 */
export function calculateDuration(
  startTime: string | Date | null | undefined,
  endTime: string | Date | null | undefined
): number {
  if (!startTime || !endTime) return 0;
  
  try {
    const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
    const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
    
    // Проверяем, что даты валидны
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn('Invalid dates provided to calculateDuration:', startTime, endTime);
      return 0;
    }
    
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  } catch (error) {
    console.error('Error calculating duration:', error, startTime, endTime);
    return 0;
  }
}
