import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Начинаем заполнение базы данных тестовыми данными...')

  // Проверяем, существует ли тестовый пользователь
  let user = await prisma.user.findUnique({
    where: { email: 'test@example.com' }
  })

  if (!user) {
    // Создаем тестового пользователя
    const hashedPassword = await bcrypt.hash('password123', 12)
    user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Тестовый пользователь',
        role: 'USER'
      }
    })
    console.log('✅ Создан тестовый пользователь')
  } else {
    console.log('✅ Тестовый пользователь уже существует')
  }

  // Проверяем, есть ли уже ученики у этого пользователя
  const existingStudents = await prisma.student.findMany({
    where: { userId: user.id }
  })

  let students = existingStudents

  if (existingStudents.length === 0) {
    // Создаем тестовых учеников
    students = await Promise.all([
      prisma.student.create({
        data: {
          fullName: 'Иванов Иван Иванович',
          phone: '+7 (999) 123-45-67',
          age: 8,
          parentName: 'Иванова Мария Петровна',
          diagnosis: 'ДЦП',
          comment: 'Требует особого внимания к моторике',
          userId: user.id
        }
      }),
      prisma.student.create({
        data: {
          fullName: 'Петрова Анна Сергеевна',
          phone: '+7 (999) 234-56-78',
          age: 10,
          parentName: 'Петров Сергей Иванович',
          diagnosis: 'Аутизм',
          comment: 'Хорошо идет на контакт',
          userId: user.id
        }
      }),
      prisma.student.create({
        data: {
          fullName: 'Сидоров Петр Александрович',
          phone: '+7 (999) 345-67-89',
          age: 7,
          parentName: 'Сидорова Елена Владимировна',
          diagnosis: 'ЗПР',
          comment: 'Активный, любит игры',
          userId: user.id
        }
      }),
      prisma.student.create({
        data: {
          fullName: 'Козлова Мария Дмитриевна',
          phone: '+7 (999) 456-78-90',
          age: 9,
          parentName: 'Козлов Дмитрий Сергеевич',
          diagnosis: 'СДВГ',
          comment: 'Нужны частые перерывы',
          userId: user.id
        }
      }),
      prisma.student.create({
        data: {
          fullName: 'Морозов Алексей Владимирович',
          phone: '+7 (999) 567-89-01',
          age: 11,
          parentName: 'Морозова Ольга Николаевна',
          diagnosis: 'ДЦП',
          comment: 'Отличные результаты в развитии речи',
          userId: user.id
        }
      })
    ])
    console.log(`✅ Создано ${students.length} учеников`)
  } else {
    console.log(`✅ Найдено ${students.length} существующих учеников`)
  }

  // Проверяем, есть ли уже уроки
  const existingLessons = await prisma.lesson.findMany({
    where: { teacherId: user.id }
  })

  if (existingLessons.length === 0 && students.length > 0) {
    // Создаем тестовые занятия
    const now = new Date()
    const lessons = []

    // Занятия на прошлую неделю
    for (let i = 0; i < 5; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - 7 - i)
      date.setHours(10 + i, 0, 0, 0)
      const endTime = new Date(date)
      endTime.setHours(date.getHours() + 1)

      lessons.push(
        prisma.lesson.create({
          data: {
            date,
            endTime,
            studentId: students[i % students.length].id,
            teacherId: user.id,
            cost: 1500 + (i * 100),
            paymentStatus: 'PAID',
            isPaid: true,
            isCompleted: true,
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
      const endTime = new Date(date)
      endTime.setHours(date.getHours() + 1)

      lessons.push(
        prisma.lesson.create({
          data: {
            date,
            endTime,
            studentId: students[i % students.length].id,
            teacherId: user.id,
            cost: 1600 + (i * 50),
            paymentStatus: 'UNPAID',
            isPaid: false,
            isCompleted: true,
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
      const endTime = new Date(date)
      endTime.setHours(date.getHours() + 1)

      lessons.push(
        prisma.lesson.create({
          data: {
            date,
            endTime,
            studentId: students[i % students.length].id,
            teacherId: user.id,
            cost: 1700 + (i * 75),
            paymentStatus: 'UNPAID',
            isPaid: false,
            isCompleted: false,
            notes: `Планируемое занятие ${i + 1}`
          }
        })
      )
    }

    await Promise.all(lessons)
    console.log(`✅ Создано ${lessons.length} занятий`)
  } else {
    console.log(`✅ Найдено ${existingLessons.length} существующих занятий`)
  }

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
