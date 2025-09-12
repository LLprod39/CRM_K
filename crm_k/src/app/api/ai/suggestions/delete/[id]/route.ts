import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// DELETE - удалить конкретное предложение по ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    // Проверяем, существует ли предложение
    const suggestion = await prisma.aISuggestion.findUnique({
      where: { id }
    });

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Предложение не найдено' }, 
        { status: 404 }
      );
    }

    // Удаляем предложение
    await prisma.aISuggestion.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Предложение удалено' });
  } catch (error) {
    console.error('Ошибка при удалении предложения:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении предложения' }, 
      { status: 500 }
    );
  }
}












