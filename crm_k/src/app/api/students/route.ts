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

    // Если админ - показываем всех учеников, иначе только своих
    const whereClause = authUser.role === 'ADMIN' 
      ? {} 
      : { userId: authUser.id }

    const students = await prisma.student.findMany({
      where: whereClause,
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

    // Для админов: если userId не указан, используем ID админа
    // Для обычных пользователей: используем их ID

    const student = await prisma.student.create({
      data: {
        fullName: body.fullName,
        phone: body.phone,
        age: body.age,
        parentName: body.parentName,
        diagnosis: body.diagnosis || null,
        comment: body.comment || null,
        userId: authUser.role === 'ADMIN' ? (body.userId || authUser.id) : authUser.id
      }
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
