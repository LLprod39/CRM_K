import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request)
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const { id: backupId } = await params
    
    // Создание резервной копии на лету
    const backupData = await createBackup()
    const filename = `backup_${new Date().toISOString().split('T')[0]}_${backupId}.json`
    
    // Логирование скачивания
    console.log(`Резервная копия скачана пользователем: ${user.email}, ID: ${backupId}`)
    
    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    console.error('Ошибка скачивания резервной копии:', error)
    return NextResponse.json({ error: 'Ошибка скачивания резервной копии' }, { status: 500 })
  }
}

async function createBackup() {
  try {
    // Получение всех данных из базы данных
    const [users, students, lessons, payments, toys] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.student.findMany(),
      prisma.lesson.findMany(),
      prisma.payment.findMany(),
      prisma.toy.findMany()
    ])

    return {
      metadata: {
        version: '1.0',
        createdAt: new Date().toISOString(),
        tables: ['users', 'students', 'lessons', 'payments', 'toys']
      },
      data: {
        users,
        students,
        lessons,
        payments,
        toys
      },
      statistics: {
        totalUsers: users.length,
        totalStudents: students.length,
        totalLessons: lessons.length,
        totalPayments: payments.length,
        totalToys: toys.length
      }
    }
  } catch (error) {
    console.error('Ошибка создания резервной копии данных:', error)
    throw error
  }
}
