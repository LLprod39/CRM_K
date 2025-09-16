import { NextResponse } from 'next/server';
import { swaggerSpec } from '@/lib/swagger';

export async function GET() {
  try {
    return NextResponse.json(swaggerSpec);
  } catch (error) {
    console.error('Ошибка генерации Swagger спецификации:', error);
    return NextResponse.json(
      { error: 'Ошибка генерации документации' },
      { status: 500 }
    );
  }
}

