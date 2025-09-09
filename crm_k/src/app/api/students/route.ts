import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CreateStudentData } from '@/types'

// GET /api/students - получить всех учеников
export async function GET() {
  try {
    const students = await prisma.student.findMany({
      include: {
        lessons: {
          orderBy: {
            date: 'desc'
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
    const body: CreateStudentData = await request.json()
    
    // Валидация обязательных полей
    if (!body.fullName || !body.phone || !body.age) {
      return NextResponse.json(
        { error: 'Необходимо заполнить все обязательные поля' },
        { status: 400 }
      )
    }

    const student = await prisma.student.create({
      data: {
        fullName: body.fullName,
        phone: body.phone,
        age: body.age,
        diagnosis: body.diagnosis || null,
        comment: body.comment || null
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
