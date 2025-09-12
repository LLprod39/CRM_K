import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { checkTimeConflicts } from '@/lib/scheduleUtils'

interface BulkLessonData {
  studentId?: string;
  studentIds?: number[];
  userId: number | null;
  cost: number;
  lessonType: 'individual' | 'group';
  notes?: string;
  isPaid: boolean;
  schedulePattern: {
    type: 'weekly' | 'monthly';
    days: number[];
    startDate: string;
    endDate: string;
    time: string;
    duration: number;
  };
}

// POST /api/lessons/bulk - создать множество занятий
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'Необходима аутентификация' },
        { status: 401 }
      )
    }

    // Только администраторы могут создавать массовые занятия
    if (authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен. Только администраторы могут создавать массовые занятия.' },
        { status: 403 }
      )
    }

    const body: BulkLessonData = await request.json()
    console.log('Получены данные для массового создания занятий:', JSON.stringify(body, null, 2))
    
    // Валидация обязательных полей
    if (!body.schedulePattern.startDate || !body.schedulePattern.endDate) {
      return NextResponse.json(
        { error: 'Необходимо указать даты начала и окончания' },
        { status: 400 }
      )
    }

    if (body.schedulePattern.days.length === 0) {
      return NextResponse.json(
        { error: 'Необходимо выбрать хотя бы один день недели' },
        { status: 400 }
      )
    }

    if (!body.cost || body.cost <= 0) {
      return NextResponse.json(
        { error: 'Стоимость должна быть больше 0' },
        { status: 400 }
      )
    }

    if (!body.userId) {
      return NextResponse.json(
        { error: 'Необходимо указать пользователя (учителя)' },
        { status: 400 }
      )
    }

    // Определяем список учеников
    const studentIds = body.lessonType === 'group' 
      ? body.studentIds! 
      : [parseInt(body.studentId!)];

    if (studentIds.length === 0) {
      return NextResponse.json(
        { error: 'Необходимо выбрать хотя бы одного ученика' },
        { status: 400 }
      )
    }

    // Проверяем, что все ученики существуют и принадлежат указанному пользователю
    const students = await prisma.student.findMany({
      where: { 
        id: { in: studentIds }
      },
      include: { user: true }
    })

    if (students.length !== studentIds.length) {
      return NextResponse.json(
        { error: 'Один или несколько учеников не найдены' },
        { status: 404 }
      )
    }

    // Проверяем принадлежность учеников
    const unauthorizedStudents = students.filter(student => student.userId !== body.userId);
    if (unauthorizedStudents.length > 0) {
      return NextResponse.json(
        { error: 'Выбранные ученики не принадлежат указанному пользователю' },
        { status: 400 }
      )
    }

    // Генерируем даты занятий
    const lessonsToCreate = generateLessonDates(body.schedulePattern, studentIds, body.cost, body.isPaid, body.notes);

    if (lessonsToCreate.length === 0) {
      return NextResponse.json(
        { error: 'Не удалось сгенерировать занятия для указанного периода' },
        { status: 400 }
      )
    }

    // Проверяем конфликты времени
    const existingLessons = await prisma.lesson.findMany({
      where: {
        isCancelled: false,
        date: {
          gte: new Date(body.schedulePattern.startDate),
          lte: new Date(body.schedulePattern.endDate)
        }
      }
    });

    // Проверяем конфликты для каждого занятия
    const conflictingLessons: Array<{
      date: Date;
      endTime: Date;
      studentId: number;
      conflict: string;
    }> = [];
    
    console.log(`Проверяем конфликты для ${lessonsToCreate.length} занятий`)
    console.log(`Найдено ${existingLessons.length} существующих занятий в периоде`)
    
    for (const lesson of lessonsToCreate) {
      const timeConflict = checkTimeConflicts(
        lesson,
        existingLessons,
        undefined,
        [], // lunchBreaks - пока не используем
        body.userId
      );

      if (timeConflict.hasConflict) {
        console.log(`Конфликт обнаружен для занятия:`, {
          date: lesson.date,
          endTime: lesson.endTime,
          studentId: lesson.studentId,
          conflict: timeConflict.message
        })
        conflictingLessons.push({
          ...lesson,
          conflict: timeConflict.message
        });
      }
    }

    if (conflictingLessons.length > 0) {
      return NextResponse.json(
        { 
          error: 'Обнаружены конфликты времени',
          conflictingLessons: conflictingLessons.map(lesson => ({
            date: lesson.date,
            endTime: lesson.endTime,
            studentId: lesson.studentId,
            conflict: lesson.conflict
          }))
        },
        { status: 409 }
      )
    }

    // Создаем занятия в транзакции
    const createdLessons = await prisma.$transaction(async (tx) => {
      const lessons = [];
      
      for (const lessonData of lessonsToCreate) {
        const lesson = await tx.lesson.create({
          data: {
            date: lessonData.date,
            endTime: lessonData.endTime,
            studentId: lessonData.studentId,
            cost: lessonData.cost,
            isCompleted: false,
            isPaid: lessonData.isPaid,
            isCancelled: false,
            notes: lessonData.notes || null,
            comment: null,
            lessonType: body.lessonType
          },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        });
        
        lessons.push(lesson);
      }
      
      return lessons;
    });

    return NextResponse.json({
      message: `Успешно создано ${createdLessons.length} занятий`,
      lessons: createdLessons,
      count: createdLessons.length
    }, { status: 201 })

  } catch (error) {
    console.error('Ошибка при массовом создании занятий:', error)
    return NextResponse.json(
      { error: 'Не удалось создать занятия' },
      { status: 500 }
    )
  }
}

// Функция для генерации дат занятий
function generateLessonDates(
  schedulePattern: BulkLessonData['schedulePattern'],
  studentIds: number[],
  cost: number,
  isPaid: boolean,
  notes?: string
) {
  const lessons: Array<{
    date: Date;
    endTime: Date;
    studentId: number;
    cost: number;
    isPaid: boolean;
    notes?: string;
  }> = [];
  const startDate = new Date(schedulePattern.startDate);
  const endDate = new Date(schedulePattern.endDate);
  const [hours, minutes] = schedulePattern.time.split(':').map(Number);

  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    
    if (schedulePattern.days.includes(dayOfWeek)) {
      const lessonDate = new Date(currentDate);
      lessonDate.setHours(hours, minutes, 0, 0);
      
      const endTime = new Date(lessonDate.getTime() + schedulePattern.duration * 60000);
      
      // Создаем занятие для каждого ученика
      for (const studentId of studentIds) {
        lessons.push({
          date: lessonDate,
          endTime: endTime,
          studentId: studentId,
          cost: cost,
          isPaid: isPaid,
          notes: notes
        });
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return lessons;
}
