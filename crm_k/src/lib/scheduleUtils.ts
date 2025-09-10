import { Lesson } from '@/types';

export interface TimeConflict {
  hasConflict: boolean;
  conflictingLessons: Lesson[];
  message: string;
}

/**
 * Проверяет конфликты времени для нового занятия
 * @param newLesson - новое занятие для проверки
 * @param existingLessons - существующие занятия
 * @param excludeLessonId - ID занятия, которое нужно исключить из проверки (для редактирования)
 * @returns объект с информацией о конфликтах
 */
export function checkTimeConflicts(
  newLesson: {
    date: Date;
    endTime: Date;
    studentId: number;
  },
  existingLessons: Lesson[],
  excludeLessonId?: number
): TimeConflict {
  const newStart = new Date(newLesson.date);
  const newEnd = new Date(newLesson.endTime);
  
  // Фильтруем занятия, исключая редактируемое
  const lessonsToCheck = existingLessons.filter(lesson => 
    lesson.id !== excludeLessonId && !lesson.isCancelled
  );
  
  const conflictingLessons: Lesson[] = [];
  
  for (const lesson of lessonsToCheck) {
    const existingStart = new Date(lesson.date);
    const existingEnd = lesson.endTime ? new Date(lesson.endTime) : new Date(existingStart.getTime() + 60 * 60 * 1000); // +1 час по умолчанию
    
    // Проверяем пересечение временных интервалов
    if (isTimeOverlap(newStart, newEnd, existingStart, existingEnd)) {
      conflictingLessons.push(lesson);
    }
  }
  
  if (conflictingLessons.length === 0) {
    return {
      hasConflict: false,
      conflictingLessons: [],
      message: 'Время свободно'
    };
  }
  
  const conflictMessage = conflictingLessons.length === 1
    ? `Конфликт с занятием в ${new Date(conflictingLessons[0].date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
    : `Конфликт с ${conflictingLessons.length} занятиями`;
  
  return {
    hasConflict: true,
    conflictingLessons,
    message: conflictMessage
  };
}

/**
 * Проверяет, пересекаются ли два временных интервала
 * @param start1 - начало первого интервала
 * @param end1 - конец первого интервала
 * @param start2 - начало второго интервала
 * @param end2 - конец второго интервала
 * @returns true, если интервалы пересекаются
 */
function isTimeOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
  return start1 < end2 && start2 < end1;
}

/**
 * Проверяет, можно ли создать занятие в указанное время
 * @param startTime - время начала
 * @param endTime - время окончания
 * @param existingLessons - существующие занятия
 * @param excludeLessonId - ID занятия для исключения
 * @returns true, если время свободно
 */
export function isTimeSlotAvailable(
  startTime: Date,
  endTime: Date,
  existingLessons: Lesson[],
  excludeLessonId?: number
): boolean {
  const conflict = checkTimeConflicts(
    { date: startTime, endTime, studentId: 0 },
    existingLessons,
    excludeLessonId
  );
  
  return !conflict.hasConflict;
}

/**
 * Получает доступные временные слоты для указанной даты
 * @param date - дата для поиска слотов
 * @param existingLessons - существующие занятия
 * @param duration - продолжительность занятия в минутах (по умолчанию 60)
 * @param startHour - час начала рабочего дня (по умолчанию 9)
 * @param endHour - час окончания рабочего дня (по умолчанию 18)
 * @returns массив доступных временных слотов
 */
export function getAvailableTimeSlots(
  date: Date,
  existingLessons: Lesson[],
  duration: number = 60,
  startHour: number = 9,
  endHour: number = 18
): { start: Date; end: Date }[] {
  const slots: { start: Date; end: Date }[] = [];
  const dayStart = new Date(date);
  dayStart.setHours(startHour, 0, 0, 0);
  
  const dayEnd = new Date(date);
  dayEnd.setHours(endHour, 0, 0, 0);
  
  const currentTime = new Date(dayStart);
  
  while (currentTime < dayEnd) {
    const slotEnd = new Date(currentTime.getTime() + duration * 60 * 1000);
    
    if (slotEnd <= dayEnd) {
      const isAvailable = isTimeSlotAvailable(currentTime, slotEnd, existingLessons);
      
      if (isAvailable) {
        slots.push({
          start: new Date(currentTime),
          end: new Date(slotEnd)
        });
      }
    }
    
    // Переходим к следующему слоту (каждые 30 минут)
    currentTime.setMinutes(currentTime.getMinutes() + 30);
  }
  
  return slots;
}
