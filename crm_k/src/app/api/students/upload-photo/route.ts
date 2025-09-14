import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Токен не предоставлен' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Неверный токен' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('photo') as File;
    const studentId = formData.get('studentId') as string;

    if (!file) {
      return NextResponse.json({ error: 'Файл не предоставлен' }, { status: 400 });
    }

    if (!studentId) {
      return NextResponse.json({ error: 'ID ученика не предоставлен' }, { status: 400 });
    }

    // Проверяем, что ученик существует и принадлежит пользователю
    const student = await prisma.student.findFirst({
      where: {
        id: parseInt(studentId),
        userId: user.id
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Ученик не найден' }, { status: 404 });
    }

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Файл должен быть изображением' }, { status: 400 });
    }

    // Проверяем размер файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Размер файла не должен превышать 5MB' }, { status: 400 });
    }

    // Создаем директорию для фото, если она не существует
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'students');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Генерируем уникальное имя файла
    const fileExtension = file.name.split('.').pop();
    const fileName = `student_${studentId}_${Date.now()}.${fileExtension}`;
    const filePath = join(uploadDir, fileName);

    // Сохраняем файл
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Создаем URL для доступа к файлу
    const photoUrl = `/uploads/students/${fileName}`;

    // Обновляем запись ученика
    const updatedStudent = await prisma.student.update({
      where: { id: parseInt(studentId) },
      data: { photoUrl }
    });

    return NextResponse.json({ 
      success: true, 
      photoUrl,
      student: updatedStudent 
    });

  } catch (error) {
    console.error('Ошибка при загрузке фото:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Токен не предоставлен' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Неверный токен' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'ID ученика не предоставлен' }, { status: 400 });
    }

    // Проверяем, что ученик существует и принадлежит пользователю
    const student = await prisma.student.findFirst({
      where: {
        id: parseInt(studentId),
        userId: user.id
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Ученик не найден' }, { status: 404 });
    }

    // Удаляем фото из базы данных
    const updatedStudent = await prisma.student.update({
      where: { id: parseInt(studentId) },
      data: { photoUrl: null }
    });

    return NextResponse.json({ 
      success: true, 
      student: updatedStudent 
    });

  } catch (error) {
    console.error('Ошибка при удалении фото:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
