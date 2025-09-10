import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { prisma } from '@/lib/db';

// Инициализация Google Gemini
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'AIzaSyDGBAljOf_M5vZr8FhICnoH6w8ij4a87OQ'
});

export async function POST(request: NextRequest) {
  try {
    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json({ error: 'ID ученика обязателен' }, { status: 400 });
    }

    // Получаем данные ученика
    const student = await prisma.student.findUnique({
      where: { id: parseInt(studentId) },
      include: {
        lessons: {
          where: { isCompleted: true },
          orderBy: { date: 'desc' },
          take: 5 // Последние 5 занятий
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Ученик не найден' }, { status: 404 });
    }

    // Получаем доступные игрушки
    const availableToys = await prisma.toy.findMany({
      where: { isAvailable: true }
    });

    // Формируем промпт для ИИ
    const prompt = `
Ты - опытный специалист по коррекционной педагогике. Составь план занятия для следующего урока на основе следующей информации:

ИНФОРМАЦИЯ ОБ УЧЕНИКЕ:
- ФИО: ${student.fullName}
- Возраст: ${student.age} лет
- Диагноз: ${student.diagnosis || 'не указан'}
- Комментарий: ${student.comment || 'нет комментариев'}

ИСТОРИЯ ЗАНЯТИЙ (последние занятия):
${student.lessons.map(lesson => 
  `- Дата: ${lesson.date.toLocaleDateString('ru-RU')}, Заметки: ${lesson.notes || 'нет заметок'}`
).join('\n')}

ДОСТУПНЫЕ ИГРУШКИ:
${availableToys.map(toy => 
  `- ${toy.name} (${toy.category || 'без категории'}): ${toy.description || 'без описания'}`
).join('\n')}

ВАЖНО: Ответь ТОЛЬКО в формате JSON без дополнительного текста. Структура должна быть такой:

{
  "title": "Название занятия",
  "duration": "Продолжительность в минутах",
  "goals": [
    "Цель 1",
    "Цель 2",
    "Цель 3"
  ],
  "materials": [
    {
      "name": "Название игрушки/материала",
      "category": "Категория",
      "description": "Как использовать"
    }
  ],
  "structure": {
    "warmup": {
      "duration": "5-10 минут",
      "activities": [
        "Активность 1",
        "Активность 2"
      ]
    },
    "main": {
      "duration": "20-30 минут",
      "activities": [
        "Основная активность 1",
        "Основная активность 2"
      ]
    },
    "conclusion": {
      "duration": "5-10 минут",
      "activities": [
        "Заключительная активность"
      ]
    }
  },
  "recommendations": [
    "Рекомендация 1 с учетом диагноза",
    "Рекомендация 2 по возрасту"
  ],
  "expectedResults": [
    "Ожидаемый результат 1",
    "Ожидаемый результат 2"
  ],
  "notes": "Дополнительные заметки для педагога"
}
`;

    // Генерируем контент с помощью Gemini
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });
    const text = result.text;

    // Парсим JSON ответ
    let parsedSuggestions;
    try {
      // Очищаем текст от возможных markdown блоков
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedSuggestions = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Ошибка парсинга JSON:', parseError);
      // Если не удалось распарсить, возвращаем как текст
      parsedSuggestions = {
        title: "План занятия",
        duration: "45 минут",
        goals: ["Развитие навыков"],
        materials: [],
        structure: {
          warmup: { duration: "10 минут", activities: ["Разминка"] },
          main: { duration: "25 минут", activities: ["Основная часть"] },
          conclusion: { duration: "10 минут", activities: ["Заключение"] }
        },
        recommendations: ["Учитывать индивидуальные особенности"],
        expectedResults: ["Положительная динамика"],
        notes: text // Возвращаем исходный текст в заметках
      };
    }

    // Сохраняем предложение в базу данных
    const savedSuggestion = await prisma.aISuggestion.create({
      data: {
        studentId: parseInt(studentId),
        title: parsedSuggestions.title,
        duration: parsedSuggestions.duration,
        goals: JSON.stringify(parsedSuggestions.goals),
        materials: JSON.stringify(parsedSuggestions.materials),
        structure: JSON.stringify(parsedSuggestions.structure),
        recommendations: JSON.stringify(parsedSuggestions.recommendations),
        expectedResults: JSON.stringify(parsedSuggestions.expectedResults),
        notes: parsedSuggestions.notes
      }
    });

    return NextResponse.json({ 
      suggestions: parsedSuggestions,
      suggestionId: savedSuggestion.id,
      student: {
        fullName: student.fullName,
        age: student.age,
        diagnosis: student.diagnosis,
        comment: student.comment
      },
      availableToys: availableToys.length
    });

  } catch (error) {
    console.error('Ошибка при генерации предложений:', error);
    return NextResponse.json(
      { error: 'Ошибка при генерации предложений занятий' }, 
      { status: 500 }
    );
  }
}
