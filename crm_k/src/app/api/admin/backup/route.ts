import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface BackupInfo {
  id: string
  filename: string
  size: number
  createdAt: Date
  type: 'manual' | 'automatic'
}

// Временное хранилище информации о резервных копиях
const backups: BackupInfo[] = []

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    // Получение списка резервных копий
    return NextResponse.json({
      backups: backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      totalSize: backups.reduce((sum, backup) => sum + backup.size, 0),
      count: backups.length
    })
  } catch (error) {
    console.error('Ошибка получения списка резервных копий:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const { type = 'manual' } = await request.json()
    
    // Создание резервной копии
    const backupData = await createBackup()
    const backupId = `backup_${Date.now()}`
    const filename = `backup_${new Date().toISOString().split('T')[0]}_${backupId}.json`
    
    // В реальном проекте здесь должно быть сохранение в файловую систему или облачное хранилище
    const backupInfo: BackupInfo = {
      id: backupId,
      filename,
      size: JSON.stringify(backupData).length,
      createdAt: new Date(),
      type: type as 'manual' | 'automatic'
    }
    
    backups.push(backupInfo)
    
    // Логирование
    console.log(`Резервная копия создана пользователем: ${user.email}, тип: ${type}`)
    
    return NextResponse.json({
      message: 'Резервная копия создана успешно',
      backup: backupInfo,
      downloadUrl: `/api/admin/backup/${backupId}/download`
    })
  } catch (error) {
    console.error('Ошибка создания резервной копии:', error)
    return NextResponse.json({ error: 'Ошибка создания резервной копии' }, { status: 500 })
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

export async function DELETE(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const backupId = searchParams.get('id')
    
    if (!backupId) {
      return NextResponse.json({ error: 'ID резервной копии не указан' }, { status: 400 })
    }

    // Удаление резервной копии
    const backupIndex = backups.findIndex(backup => backup.id === backupId)
    if (backupIndex === -1) {
      return NextResponse.json({ error: 'Резервная копия не найдена' }, { status: 404 })
    }

    backups.splice(backupIndex, 1)
    
    console.log(`Резервная копия удалена пользователем: ${user.email}, ID: ${backupId}`)
    
    return NextResponse.json({ message: 'Резервная копия удалена успешно' })
  } catch (error) {
    console.error('Ошибка удаления резервной копии:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
