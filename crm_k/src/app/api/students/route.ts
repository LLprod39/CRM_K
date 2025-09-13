import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CreateStudentData } from '@/types'
import { getAuthUser } from '@/lib/auth'

// GET /api/students - получить всех учеников
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'Необходима аутентификация' },
        { status: 401 }
      )
    }

    // Если админ - показываем всех учеников
    // Если учитель - показываем своих назначенных учеников ИЛИ учеников, с которыми проводит/проводил занятия
    const whereClause = authUser.role === 'ADMIN' 
      ? {} 
      : {
          OR: [
            { userId: authUser.id }, // Свои назначенные ученики
            { 
              lessons: {
                some: {
                  teacherId: authUser.id // Ученики, с которыми проводит/проводил занятия
                }
              }
            }
          ]
        }

    const students = await prisma.student.findMany({
      where: whereClause as any,
      include: {
        lessons: {
          orderBy: {
            date: 'desc'
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(students)
  } catch (error) {
    console.error('Ошибка при получении учеников:', error)
    return NextResponse.json(
      { error: 'Не удалось получить список учеников' },
      { status: 500 }
    )
  }
}

// POST /api/students - создать нового ученика
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'Необходима аутентификация' },
        { status: 401 }
      )
    }

    const body: CreateStudentData & { userId?: number } = await request.json()
    
    // Валидация обязательных полей
    if (!body.fullName || !body.phone || !body.age || !body.parentName) {
      return NextResponse.json(
        { error: 'Необходимо заполнить все обязательные поля' },
        { status: 400 }
      )
    }

    // Новая логика:
    // - Если админ создает ученика: ученик остается "нечейный" (userId = null, isAssigned = false)
    // - Если учитель создает ученика: ученик привязывается к учителю (userId = teacherId, isAssigned = true)
    let userId: number | null = null
    let isAssigned = false

    if (authUser.role === 'ADMIN') {
      // Админ создает "нечейного" ученика
      userId = null
      isAssigned = false
    } else {
      // Учитель создает ученика и привязывает к себе
      userId = authUser.id
      isAssigned = true
    }

    const student = await prisma.student.create({
      data: {
        fullName: body.fullName,
        phone: body.phone,
        age: body.age,
        parentName: body.parentName,
        diagnosis: body.diagnosis || null,
        comment: body.comment || null,
        userId: userId || undefined,
        isAssigned: isAssigned
      } as any
    })

    return NextResponse.json(student, { status: 201 })
  } catch (error) {
    console.error('Ошибка при создании ученика:', error)
    return NextResponse.json(
      { error: 'Не удалось создать ученика' },
      { status: 500 }
    )
  }
}
