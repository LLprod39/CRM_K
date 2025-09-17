import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// GET /api/admin/users - получить всех пользователей
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'Необходима аутентификация' },
        { status: 401 }
      )
    }

    if (authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            students: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Ошибка получения пользователей:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// POST /api/admin/users - создать нового пользователя
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'Необходима аутентификация' },
        { status: 401 }
      )
    }

    if (authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const { name, email, password, phone, role } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Необходимо заполнить все обязательные поля' },
        { status: 400 }
      )
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(email)) {
      return NextResponse.json(
        { error: 'Некорректный формат email' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли пользователь с таким email
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      )
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 12)

    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role: role || 'USER'
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Ошибка создания пользователя:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
