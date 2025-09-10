import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - получить все предложения для ученика
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId: studentIdParam } = await params;
    const studentId = parseInt(studentIdParam);

    const suggestions = await prisma.aISuggestion.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' }
    });

    // Парсим JSON поля
    const parsedSuggestions = suggestions.map(suggestion => ({
      id: suggestion.id,
      title: suggestion.title,
      duration: suggestion.duration,
      goals: JSON.parse(suggestion.goals),
      materials: JSON.parse(suggestion.materials),
      structure: JSON.parse(suggestion.structure),
      recommendations: JSON.parse(suggestion.recommendations),
      expectedResults: JSON.parse(suggestion.expectedResults),
      notes: suggestion.notes,
      createdAt: suggestion.createdAt
    }));

    return NextResponse.json(parsedSuggestions);
  } catch (error) {
    console.error('Ошибка при получении предложений:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении предложений' }, 
      { status: 500 }
    );
  }
}

// DELETE - удалить все предложения для ученика
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId: studentIdParam } = await params;
    const studentId = parseInt(studentIdParam);

    await prisma.aISuggestion.deleteMany({
      where: { studentId }
    });

    return NextResponse.json({ message: 'Все предложения удалены' });
  } catch (error) {
    console.error('Ошибка при удалении предложений:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении предложений' }, 
      { status: 500 }
    );
  }
}