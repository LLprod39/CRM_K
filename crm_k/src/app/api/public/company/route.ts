import { NextRequest, NextResponse } from 'next/server'

// GET /api/public/company - получить информацию о компании
export async function GET(request: NextRequest) {
  try {
    // Здесь можно добавить информацию о компании из базы данных
    // Пока возвращаем статичную информацию
    const companyInfo = {
      name: "Центр развития детей",
      description: "Мы специализируемся на индивидуальном подходе к развитию каждого ребенка. Наши опытные педагоги помогают детям раскрыть свой потенциал и достичь успехов в обучении.",
      services: [
        {
          title: "Индивидуальные занятия",
          description: "Персональный подход к каждому ребенку с учетом его особенностей и потребностей"
        },
        {
          title: "Групповые занятия", 
          description: "Развитие социальных навыков и взаимодействия со сверстниками"
        },
        {
          title: "Консультации родителей",
          description: "Профессиональные советы по воспитанию и развитию ребенка"
        }
      ],
      benefits: [
        "Опытные педагоги с профильным образованием",
        "Индивидуальный подход к каждому ребенку",
        "Современные методики обучения",
        "Удобное расписание занятий",
        "Доступные цены"
      ],
      contact: {
        phone: "+7 (XXX) XXX-XX-XX",
        email: "info@example.com",
        address: "г. Москва, ул. Примерная, д. 1",
        workingHours: "Пн-Пт: 9:00-18:00, Сб: 9:00-15:00"
      },
      stats: {
        yearsExperience: 5,
        studentsHelped: 150,
        teachersCount: 8,
        successRate: 95
      }
    }

    return NextResponse.json(companyInfo)
  } catch (error) {
    console.error('Ошибка получения информации о компании:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

