import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// PUT - обновить игрушку
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, description, category, isAvailable } = await request.json();
    const toyId = parseInt(params.id);

    if (!name) {
      return NextResponse.json({ error: 'Название игрушки обязательно' }, { status: 400 });
    }

    const toy = await prisma.toy.update({
      where: { id: toyId },
      data: {
        name,
        description,
        category,
        isAvailable
      }
    });

    return NextResponse.json(toy);
  } catch (error) {
    console.error('Ошибка при обновлении игрушки:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении игрушки' }, 
      { status: 500 }
    );
  }
}

// DELETE - удалить игрушку
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const toyId = parseInt(params.id);

    await prisma.toy.delete({
      where: { id: toyId }
    });

    return NextResponse.json({ message: 'Игрушка удалена' });
  } catch (error) {
    console.error('Ошибка при удалении игрушки:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении игрушки' }, 
      { status: 500 }
    );
  }
}
