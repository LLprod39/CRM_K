const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTestLessons() {
  try {
    console.log('🌱 Добавление тестовых занятий...');

    // Находим существующего пользователя
    const user = await prisma.user.findFirst({
      where: { email: 'teacher@test.com' }
    });

    if (!user) {
      console.log('❌ Пользователь teacher@test.com не найден');
      return;
    }

    console.log(`✅ Найден пользователь: ${user.name} (${user.email})`);

    // Находим или создаем ученика
    let student = await prisma.student.findFirst({
      where: { userId: user.id }
    });

    if (!student) {
      console.log('👶 Создаем тестового ученика...');
      student = await prisma.student.create({
        data: {
          fullName: 'Тестовый Ученик',
          phone: '+7 (999) 123-45-67',
          age: 8,
          diagnosis: 'Тестовый диагноз',
          comment: 'Тестовый комментарий',
          parentName: 'Тестовая Мама',
          userId: user.id
        }
      });
      console.log(`✅ Ученик создан: ${student.fullName}`);
    } else {
      console.log(`✅ Найден ученик: ${student.fullName}`);
    }

    // Удаляем старые тестовые занятия
    console.log('🗑️ Удаляем старые тестовые занятия...');
    await prisma.lesson.deleteMany({
      where: {
        studentId: student.id,
        notes: { startsWith: 'Тестовое занятие' }
      }
    });

    // Создаем занятия за последние 30 дней для графика
    console.log('📚 Создаем тестовые занятия...');
    const now = new Date();
    let lessonsCreated = 0;
    
    for (let i = 0; i < 30; i++) {
      const lessonDate = new Date(now);
      lessonDate.setDate(now.getDate() - i);
      
      // Создаем 1-3 занятия в день с разной вероятностью
      const lessonsCount = Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0;
      
      for (let j = 0; j < lessonsCount; j++) {
        const lessonTime = new Date(lessonDate);
        lessonTime.setHours(10 + j * 2, 0, 0, 0);
        
        const isCompleted = Math.random() > 0.3; // 70% вероятность что занятие проведено
        const isPaid = isCompleted && Math.random() > 0.4; // 60% вероятность что оплачено
        
        const endTime = new Date(lessonTime);
        endTime.setHours(lessonTime.getHours() + 1); // Занятие длится 1 час

        await prisma.lesson.create({
          data: {
            date: lessonTime,
            endTime: endTime,
            studentId: student.id,
            cost: 2000 + Math.floor(Math.random() * 1000), // Стоимость от 2000 до 3000
            isCompleted,
            isPaid,
            isCancelled: false,
            notes: `Тестовое занятие ${i + 1}-${j + 1}`
          }
        });
        lessonsCreated++;
      }
    }

    console.log(`✅ Создано ${lessonsCreated} тестовых занятий`);

    // Показываем статистику
    const totalLessons = await prisma.lesson.count({
      where: { studentId: student.id }
    });

    const paidLessons = await prisma.lesson.count({
      where: { 
        studentId: student.id,
        isCompleted: true,
        isPaid: true
      }
    });

    const totalRevenue = await prisma.lesson.aggregate({
      where: { 
        studentId: student.id,
        isCompleted: true,
        isPaid: true
      },
      _sum: { cost: true }
    });

    console.log('\n📊 Статистика:');
    console.log(`Всего занятий: ${totalLessons}`);
    console.log(`Оплаченных занятий: ${paidLessons}`);
    console.log(`Общий доход: ${totalRevenue._sum.cost || 0} тенге`);

    console.log('\n🎉 Тестовые данные добавлены!');

  } catch (error) {
    console.error('❌ Ошибка при добавлении тестовых данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestLessons();
