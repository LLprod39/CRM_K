import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - получить все игрушки
export async function GET() {
  try {
    const toys = await prisma.toy.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(toys);
  } catch (error) {
    console.error('Ошибка при получении игрушек:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении игрушек' }, 
      { status: 500 }
    );
  }
}

// POST - создать новую игрушку
export async function POST(request: NextRequest) {
  try {
    const { name, description, category } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Название игрушки обязательно' }, { status: 400 });
    }

    const toy = await prisma.toy.create({
      data: {
        name,
        description,
        category
      }
    });

    return NextResponse.json(toy, { status: 201 });
  } catch (error) {
    console.error('Ошибка при создании игрушки:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании игрушки' }, 
      { status: 500 }
    );
  }
}
