import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Начинаем заполнение базы данных тестовыми данными...')

  // Создаем тестовых учеников
  const students = await Promise.all([
    prisma.student.create({
      data: {
        fullName: 'Иванов Иван Иванович',
        phone: '+7 (999) 123-45-67',
        age: 8,
        diagnosis: 'ДЦП',
        comment: 'Требует особого внимания к моторике'
      }
    }),
    prisma.student.create({
      data: {
        fullName: 'Петрова Анна Сергеевна',
        phone: '+7 (999) 234-56-78',
        age: 10,
        diagnosis: 'Аутизм',
        comment: 'Хорошо идет на контакт'
      }
    }),
    prisma.student.create({
      data: {
        fullName: 'Сидоров Петр Александрович',
        phone: '+7 (999) 345-67-89',
        age: 7,
        diagnosis: 'ЗПР',
        comment: 'Активный, любит игры'
      }
    }),
    prisma.student.create({
      data: {
        fullName: 'Козлова Мария Дмитриевна',
        phone: '+7 (999) 456-78-90',
        age: 9,
        diagnosis: 'СДВГ',
        comment: 'Нужны частые перерывы'
      }
    }),
    prisma.student.create({
      data: {
        fullName: 'Морозов Алексей Владимирович',
        phone: '+7 (999) 567-89-01',
        age: 11,
        diagnosis: 'ДЦП',
        comment: 'Отличные результаты в развитии речи'
      }
    })
  ])

  console.log(`✅ Создано ${students.length} учеников`)

  // Создаем тестовые занятия
  const now = new Date()
  const lessons = []

  // Занятия на прошлую неделю
  for (let i = 0; i < 5; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - 7 - i)
    date.setHours(10 + i, 0, 0, 0)

    lessons.push(
      prisma.lesson.create({
        data: {
          date,
          studentId: students[i % students.length].id,
          cost: 1500 + (i * 100),
          status: 'PAID',
          notes: `Занятие ${i + 1} - работа над моторикой`
        }
      })
    )
  }

  // Занятия на эту неделю
  for (let i = 0; i < 3; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - 3 + i)
    date.setHours(14 + i, 0, 0, 0)

    lessons.push(
      prisma.lesson.create({
        data: {
          date,
          studentId: students[i % students.length].id,
          cost: 1600 + (i * 50),
          status: 'COMPLETED',
          notes: `Занятие ${i + 1} - развитие речи`
        }
      })
    )
  }

  // Будущие занятия
  for (let i = 0; i < 4; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() + 1 + i)
    date.setHours(9 + i, 0, 0, 0)

    lessons.push(
      prisma.lesson.create({
        data: {
          date,
          studentId: students[i % students.length].id,
          cost: 1700 + (i * 75),
          status: 'SCHEDULED',
          notes: `Планируемое занятие ${i + 1}`
        }
      })
    )
  }

  await Promise.all(lessons)
  console.log(`✅ Создано ${lessons.length} занятий`)

  console.log('🎉 База данных успешно заполнена тестовыми данными!')
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
