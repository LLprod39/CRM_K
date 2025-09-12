import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { prisma } from '@/lib/db';

// Инициализация Google Gemini
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'AIzaSyDGBAljOf_M5vZr8FhICnoH6w8ij4a87OQ'
});

export async function POST(request: NextRequest) {
  try {
    const { studentId, lessonId } = await request.json();

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

    // Получаем информацию о конкретном занятии, если lessonId предоставлен
    let selectedLesson = null;
    if (lessonId) {
      selectedLesson = await prisma.lesson.findUnique({
        where: { id: parseInt(lessonId) },
        include: {
          student: true
        }
      });

      if (!selectedLesson || selectedLesson.studentId !== parseInt(studentId)) {
        return NextResponse.json({ error: 'Занятие не найдено или не принадлежит ученику' }, { status: 404 });
      }
    }

    // Получаем доступные игрушки
    const availableToys = await prisma.toy.findMany({
      where: { isAvailable: true }
    });

    // Формируем промпт для ИИ
    const prompt = `
# Инструкция для модели

Ты — опытный специалист по коррекционной педагогике и детский клинический психолог с многолетним опытом работы с детьми с особыми образовательными потребностями. Твоя задача — на основе следующих данных составить подробный и адаптированный план предстоящего занятия.

## Шаблон входных данных

ИНФОРМАЦИЯ ОБ УЧЕНИКЕ  
- ФИО: ${student.fullName}  
- Возраст: ${student.age} лет  
- Диагноз: ${student.diagnosis || 'не указан'}  
- Комментарий: ${student.comment || 'нет комментариев'}  

${selectedLesson ? `  
ИНФОРМАЦИЯ О ВЫБРАННОМ ЗАНЯТИИ  
- Дата и время: ${selectedLesson.date.toLocaleString('ru-RU')}  
- Продолжительность: ${selectedLesson.endTime ? `${Math.round((new Date(selectedLesson.endTime) - new Date(selectedLesson.date)) / 60000)} минут` : 'не указана'}  
- Тип занятия: ${selectedLesson.lessonType || 'индивидуальное'}  
- Место проведения: ${selectedLesson.location || 'офис'}  
- Заметки: ${selectedLesson.notes || 'нет заметок'}  
` : ''}  

ИСТОРИЯ ПОСЛЕДНИХ ЗАНЯТИЙ  
${student.lessons.map(l => `- ${l.date.toLocaleDateString('ru-RU')}: ${l.notes || 'нет заметок'}`).join('\n')}  

ДОСТУПНЫЕ ИГРУШКИ И МАТЕРИАЛЫ  
${availableToys.map(t => `- ${t.name} (${t.category || 'без категории'}): ${t.description || 'без описания'}`).join('\n')}  

---

## Задача

На основе этих данных составь текстовый план занятия, структурированный по разделам:

1. **Название занятия**  
2. **Длительность**  
3. **Цели** (3–5 адаптированных целей)  
4. **Материалы и игрушки** (название, категория, как использовать)  
5. **Структура занятия**  
   - Разминка (5–10 минут, активности)  
   - Основная часть (20–30 минут, активности)  
   - Заключение (5–10 минут, активности)  
6. **Рекомендации** (учитывая диагноз и возраст)  
7. **Ожидаемые результаты**  
8. **Дополнительные заметки для педагога**

Старайся давать конкретные, практические описания упражнений и объяснять, почему они важны для данного ребёнка.

ВАЖНО: Ответь ТОЛЬКО в формате JSON без дополнительного текста. Структура должна быть такой:

{
  "title": "Название занятия${selectedLesson ? ` на ${selectedLesson.date.toLocaleDateString('ru-RU')}` : ''}",
  "duration": "${selectedLesson && selectedLesson.endTime ? 
    Math.round((new Date(selectedLesson.endTime).getTime() - new Date(selectedLesson.date).getTime()) / (1000 * 60)) : 
    '45'} минут",
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
      const cleanText = (text || '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
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
