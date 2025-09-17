import { prisma } from '@/lib/db'

export interface ConflictCheckResult {
  hasConflict: boolean
  conflicts: string[]
  canCreate: boolean
}

export interface LessonConflictData {
  date: Date
  endTime: Date
  teacherId: number
  studentIds: number[]
  lessonType: 'individual' | 'group'
  excludeLessonId?: number // Для обновления существующего занятия
}

/**
 * Проверяет конфликты при создании/обновлении занятия
 */
export async function checkLessonConflicts(data: LessonConflictData): Promise<ConflictCheckResult> {
  const conflicts: string[] = []
  
  try {
    // 1. Проверка: больше двух учителей не могут заниматься одновременно
    const teacherConflict = await checkTeacherTimeConflict(data)
    if (teacherConflict.hasConflict) {
      conflicts.push(...teacherConflict.conflicts)
    }

    // 2. Проверка: групповые занятия максимум 2 детей на одного учителя
    if (data.lessonType === 'group') {
      const groupConflict = await checkGroupSizeLimit(data)
      if (groupConflict.hasConflict) {
        conflicts.push(...groupConflict.conflicts)
      }
    }

    // 3. Проверка: конфликты пользователей (одинаковое время)
    const userConflict = await checkUserTimeConflict(data)
    if (userConflict.hasConflict) {
      conflicts.push(...userConflict.conflicts)
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
      canCreate: conflicts.length === 0
    }
  } catch (error) {
    console.error('Ошибка при проверке конфликтов занятий:', error)
    return {
      hasConflict: true,
      conflicts: ['Ошибка при проверке конфликтов занятий'],
      canCreate: false
    }
  }
}

/**
 * Проверяет, что больше двух учителей не занимаются одновременно
 */
async function checkTeacherTimeConflict(data: LessonConflictData): Promise<ConflictCheckResult> {
  const conflicts: string[] = []
  
  // Получаем всех учителей, которые заняты в это время
  const conflictingLessons = await prisma.lesson.findMany({
    where: {
      isCancelled: false,
      date: {
        lt: data.endTime
      },
      endTime: {
        gt: data.date
      },
      ...(data.excludeLessonId ? { id: { not: data.excludeLessonId } } : {})
    },
    include: {
      teacher: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })

  // Группируем по времени и считаем уникальных учителей
  const timeSlots = new Map<string, Set<number>>()
  
  conflictingLessons.forEach(lesson => {
    const slotKey = `${lesson.date.toISOString()}-${lesson.endTime.toISOString()}`
    if (!timeSlots.has(slotKey)) {
      timeSlots.set(slotKey, new Set())
    }
    timeSlots.get(slotKey)!.add(lesson.teacherId)
  })

  // Проверяем каждый временной слот
  for (const [slotKey, teacherIds] of timeSlots) {
    if (teacherIds.size >= 2) {
      const teacherNames = Array.from(teacherIds).map(id => {
        const lesson = conflictingLessons.find(l => l.teacherId === id)
        return lesson?.teacher.name || `Учитель ${id}`
      })
      
      conflicts.push(`В это время уже заняты ${teacherNames.length} учителя: ${teacherNames.join(', ')}`)
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
    canCreate: conflicts.length === 0
  }
}

/**
 * Проверяет ограничение групповых занятий (максимум 2 детей на учителя)
 */
async function checkGroupSizeLimit(data: LessonConflictData): Promise<ConflictCheckResult> {
  const conflicts: string[] = []
  
  if (data.studentIds.length > 2) {
    conflicts.push('Групповое занятие не может включать более 2 детей')
  }

  // Проверяем, нет ли уже групповых занятий у этого учителя в это время
  const existingGroupLessons = await prisma.lesson.findMany({
    where: {
      teacherId: data.teacherId,
      lessonType: 'group',
      isCancelled: false,
      date: {
        lt: data.endTime
      },
      endTime: {
        gt: data.date
      },
      ...(data.excludeLessonId ? { id: { not: data.excludeLessonId } } : {})
    },
    include: {
      student: {
        select: {
          id: true,
          fullName: true
        }
      }
    }
  })

  // Подсчитываем общее количество детей в групповых занятиях в это время
  const totalStudentsInGroups = existingGroupLessons.length
  
  if (totalStudentsInGroups + data.studentIds.length > 2) {
    const existingStudentNames = existingGroupLessons.map(lesson => lesson.student.fullName)
    conflicts.push(`У учителя уже есть групповые занятия с ${existingStudentNames.length} детьми в это время: ${existingStudentNames.join(', ')}`)
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
    canCreate: conflicts.length === 0
  }
}

/**
 * Проверяет конфликты пользователей (одинаковое время)
 */
async function checkUserTimeConflict(data: LessonConflictData): Promise<ConflictCheckResult> {
  const conflicts: string[] = []
  
  // Получаем всех учеников и их владельцев
  const students = await prisma.student.findMany({
    where: {
      id: { in: data.studentIds }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })

  // Группируем учеников по владельцам
  const studentsByOwner = new Map<number, typeof students>()
  students.forEach(student => {
    if (student.userId) {
      if (!studentsByOwner.has(student.userId)) {
        studentsByOwner.set(student.userId, [])
      }
      studentsByOwner.get(student.userId)!.push(student)
    }
  })

  // Проверяем каждого владельца на конфликты времени
  for (const [ownerId, ownerStudents] of studentsByOwner) {
    const studentIds = ownerStudents.map(s => s.id)
    
    // Ищем существующие занятия этих учеников в это время
    const existingLessons = await prisma.lesson.findMany({
      where: {
        studentId: { in: studentIds },
        isCancelled: false,
        date: {
          lt: data.endTime
        },
        endTime: {
          gt: data.date
        },
        ...(data.excludeLessonId ? { id: { not: data.excludeLessonId } } : {})
      },
      include: {
        student: {
          select: {
            fullName: true
          }
        }
      }
    })

    if (existingLessons.length > 0) {
      const conflictingStudentNames = existingLessons.map(lesson => lesson.student.fullName)
      const ownerName = ownerStudents[0].user?.name || 'Неизвестный пользователь'
      conflicts.push(`У пользователя ${ownerName} уже есть занятия в это время: ${conflictingStudentNames.join(', ')}`)
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
    canCreate: conflicts.length === 0
  }
}

/**
 * Проверяет доступность слота для записи (учитывает обеденные перерывы)
 */
export async function checkSlotAvailability(
  teacherId: number,
  date: Date,
  endTime: Date
): Promise<{ isAvailable: boolean; reason?: string }> {
  try {
    // Проверяем обеденные перерывы
    const lunchBreaks = await prisma.lunchBreak.findMany({
      where: {
        userId: teacherId,
        date: {
          gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
        }
      }
    })

    for (const lunchBreak of lunchBreaks) {
      const breakStart = new Date(lunchBreak.startTime)
      const breakEnd = new Date(lunchBreak.endTime)
      
      // Устанавливаем правильную дату для времени обеда
      breakStart.setFullYear(date.getFullYear(), date.getMonth(), date.getDate())
      breakEnd.setFullYear(date.getFullYear(), date.getMonth(), date.getDate())
      
      // Проверяем пересечение времени
      if (date < breakEnd && endTime > breakStart) {
        return {
          isAvailable: false,
          reason: `Время пересекается с обеденным перерывом (${breakStart.toLocaleTimeString()} - ${breakEnd.toLocaleTimeString()})`
        }
      }
    }

    return { isAvailable: true }
  } catch (error) {
    console.error('Ошибка при проверке доступности слота:', error)
    return {
      isAvailable: false,
      reason: 'Ошибка при проверке доступности слота'
    }
  }
}

/**
 * Освобождает слот при удалении занятия или обеда
 */
export async function releaseSlot(teacherId: number, date: Date, endTime: Date): Promise<void> {
  // Эта функция может быть использована для уведомления о освобождении слота
  // или для логирования освобожденных слотов
  console.log(`Слот освобожден для учителя ${teacherId}: ${date.toISOString()} - ${endTime.toISOString()}`)
}
