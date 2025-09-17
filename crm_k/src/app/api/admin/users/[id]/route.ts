import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// PUT /api/admin/users/[id] - обновить пользователя
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const userId = parseInt(id)
    const body = await request.json()

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'Нет данных для обновления' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    const { name, email, password, phone, role } = body as {
      name?: string
      email?: string
      password?: string
      phone?: string | null
      role?: 'ADMIN' | 'USER'
    }

    const updateData: {
      name?: string
      email?: string
      role?: 'ADMIN' | 'USER'
      phone?: string | null
      password?: string
    } = {}

    if (typeof name === 'string') {
      updateData.name = name
    }

    if (typeof phone !== 'undefined') {
      updateData.phone = phone || null
    }

    if (typeof role === 'string' && (role === 'ADMIN' || role === 'USER')) {
      updateData.role = role
    }

    if (typeof email === 'string') {
      if (!emailPattern.test(email)) {
        return NextResponse.json(
          { error: 'Некорректный формат email' },
          { status: 400 }
        )
      }

      const emailUser = await prisma.user.findUnique({
        where: { email }
      })

      if (emailUser && emailUser.id !== userId) {
        return NextResponse.json(
          { error: 'Пользователь с таким email уже существует' },
          { status: 400 }
        )
      }

      updateData.email = email
    }

    if (typeof password === 'string' && password.length > 0) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Нет данных для обновления' },
        { status: 400 }
      )
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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

    return NextResponse.json(user)
  } catch (error) {
    console.error('Ошибка обновления пользователя:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[id] - удалить пользователя
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const userId = parseInt(id)

    if (userId === authUser.id) {
      return NextResponse.json(
        { error: 'нельзя удалить самого себя' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    const students = await prisma.student.findMany({
      where: { userId },
      select: { id: true }
    })

    const studentIds = students.map(({ id }) => id)

    if (studentIds.length > 0) {
      await prisma.payment.deleteMany({
        where: { studentId: { in: studentIds } }
      })

      await prisma.lesson.deleteMany({
        where: {
          OR: [
            { studentId: { in: studentIds } },
            { teacherId: userId }
          ]
        }
      })

      await prisma.student.deleteMany({
        where: { id: { in: studentIds } }
      })
    }

    await prisma.lunchBreak.deleteMany({
      where: { userId }
    })

    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({ message: 'Пользователь удален' })
  } catch (error) {
    console.error('Ошибка удаления пользователя:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
