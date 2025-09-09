const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedTestData() {
  try {
    console.log('🌱 Создание тестовых данных...');

    // Создаем дополнительных пользователей
    const users = [
      {
        email: 'teacher1@test.com',
        password: await bcrypt.hash('teacher123', 12),
        name: 'Анна Петрова',
        role: 'USER'
      },
      {
        email: 'teacher2@test.com',
        password: await bcrypt.hash('teacher123', 12),
        name: 'Мария Сидорова',
        role: 'USER'
      },
      {
        email: 'teacher3@test.com',
        password: await bcrypt.hash('teacher123', 12),
        name: 'Елена Козлова',
        role: 'USER'
      }
    ];

    console.log('👥 Создаем пользователей...');
    const createdUsers = [];
    for (const userData of users) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (!existingUser) {
        const user = await prisma.user.create({
          data: userData
        });
        createdUsers.push(user);
        console.log(`✅ Создан пользователь: ${user.name} (${user.email})`);
      } else {
        createdUsers.push(existingUser);
        console.log(`ℹ️  Пользователь уже существует: ${existingUser.name}`);
      }
    }

    // Получаем всех пользователей (включая админа)
    const allUsers = await prisma.user.findMany();
    console.log(`📊 Всего пользователей: ${allUsers.length}`);

    // Создаем учеников для каждого пользователя
    const studentsData = [
      // Для админа (уже есть данные)
      {
        userId: allUsers.find(u => u.role === 'ADMIN').id,
        students: [
          {
            fullName: 'Иван Петров',
            phone: '+7 (999) 123-45-67',
            age: 8,
            diagnosis: 'ДЦП',
            comment: 'Требует особого внимания к моторике'
          },
          {
            fullName: 'София Козлова',
            phone: '+7 (999) 234-56-78',
            age: 6,
            diagnosis: 'Аутизм',
            comment: 'Хорошо реагирует на музыку'
          }
        ]
      },
      // Для teacher1
      {
        userId: createdUsers[0]?.id || allUsers.find(u => u.email === 'teacher1@test.com')?.id,
        students: [
          {
            fullName: 'Алексей Смирнов',
            phone: '+7 (999) 345-67-89',
            age: 7,
            diagnosis: 'ЗПР',
            comment: 'Активный, любит игры'
          },
          {
            fullName: 'Варвара Морозова',
            phone: '+7 (999) 456-78-90',
            age: 9,
            diagnosis: 'СДВГ',
            comment: 'Нужны частые перерывы'
          },
          {
            fullName: 'Дмитрий Волков',
            phone: '+7 (999) 567-89-01',
            age: 5,
            diagnosis: 'Нарушение речи',
            comment: 'Работаем над произношением'
          }
        ]
      },
      // Для teacher2
      {
        userId: createdUsers[1]?.id || allUsers.find(u => u.email === 'teacher2@test.com')?.id,
        students: [
          {
            fullName: 'Алиса Новикова',
            phone: '+7 (999) 678-90-12',
            age: 8,
            diagnosis: 'ДЦП',
            comment: 'Показывает хорошие результаты'
          },
          {
            fullName: 'Максим Лебедев',
            phone: '+7 (999) 789-01-23',
            age: 6,
            diagnosis: 'Аутизм',
            comment: 'Любит рисовать'
          }
        ]
      },
      // Для teacher3
      {
        userId: createdUsers[2]?.id || allUsers.find(u => u.email === 'teacher3@test.com')?.id,
        students: [
          {
            fullName: 'Полина Соколова',
            phone: '+7 (999) 890-12-34',
            age: 7,
            diagnosis: 'ЗПР',
            comment: 'Усидчивая, внимательная'
          },
          {
            fullName: 'Артем Кузнецов',
            phone: '+7 (999) 901-23-45',
            age: 10,
            diagnosis: 'СДВГ',
            comment: 'Требует индивидуального подхода'
          },
          {
            fullName: 'Милана Попова',
            phone: '+7 (999) 012-34-56',
            age: 6,
            diagnosis: 'Нарушение речи',
            comment: 'Быстро осваивает новые слова'
          }
        ]
      }
    ];

    console.log('👶 Создаем учеников...');
    const allStudents = [];
    for (const userData of studentsData) {
      if (!userData.userId) continue;

      for (const studentData of userData.students) {
        const existingStudent = await prisma.student.findFirst({
          where: {
            fullName: studentData.fullName,
            userId: userData.userId
          }
        });

        if (!existingStudent) {
          const student = await prisma.student.create({
            data: {
              ...studentData,
              userId: userData.userId
            }
          });
          allStudents.push(student);
          console.log(`✅ Создан ученик: ${student.fullName}`);
        } else {
          allStudents.push(existingStudent);
        }
      }
    }

    console.log(`📊 Всего учеников: ${allStudents.length}`);

    // Создаем занятия для каждого ученика
    console.log('📚 Создаем занятия...');
    const lessonStatuses = ['SCHEDULED', 'COMPLETED', 'PAID', 'CANCELLED'];
    const costs = [1500, 2000, 2500, 3000];
    const notes = [
      'Отличная работа!',
      'Нужно больше практики',
      'Ребенок устал',
      'Очень внимательный',
      'Требует повторения материала',
      'Показывает прогресс',
      'Нужна помощь родителей',
      'Самостоятельно справляется'
    ];

    let totalLessons = 0;
    for (const student of allStudents) {
      // Создаем 8-15 занятий для каждого ученика
      const lessonsCount = Math.floor(Math.random() * 8) + 8;
      
      for (let i = 0; i < lessonsCount; i++) {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 90)); // Последние 3 месяца
        date.setHours(9 + Math.floor(Math.random() * 8), Math.random() < 0.5 ? 0 : 30, 0, 0);

        const status = lessonStatuses[Math.floor(Math.random() * lessonStatuses.length)];
        const cost = costs[Math.floor(Math.random() * costs.length)];
        const note = notes[Math.floor(Math.random() * notes.length)];

        const existingLesson = await prisma.lesson.findFirst({
          where: {
            studentId: student.id,
            date: date
          }
        });

        if (!existingLesson) {
          await prisma.lesson.create({
            data: {
              date: date,
              studentId: student.id,
              cost: cost,
              status: status,
              notes: Math.random() < 0.7 ? note : null
            }
          });
          totalLessons++;
        }
      }
    }

    console.log(`✅ Создано занятий: ${totalLessons}`);

    // Выводим статистику
    const stats = await prisma.lesson.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { cost: true }
    });

    console.log('\n📈 Статистика занятий:');
    stats.forEach(stat => {
      console.log(`${stat.status}: ${stat._count.id} занятий, ${stat._sum.cost || 0} ₽`);
    });

    const totalRevenue = stats.reduce((sum, stat) => sum + (stat._sum.cost || 0), 0);
    console.log(`💰 Общая выручка: ${totalRevenue} ₽`);

    console.log('\n🎉 Тестовые данные успешно созданы!');
    console.log('\n📋 Учетные данные для входа:');
    console.log('Админ: admin@crm.com / admin123');
    console.log('Учитель 1: teacher1@test.com / teacher123');
    console.log('Учитель 2: teacher2@test.com / teacher123');
    console.log('Учитель 3: teacher3@test.com / teacher123');

  } catch (error) {
    console.error('❌ Ошибка при создании тестовых данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestData();
