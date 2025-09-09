const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addMoreFinancialData() {
  try {
    console.log('💰 Добавляем дополнительные финансовые данные...');

    // Получаем всех учеников
    const students = await prisma.student.findMany({
      include: {
        user: true
      }
    });

    console.log(`📊 Найдено учеников: ${students.length}`);

    // Создаем дополнительные занятия с разными статусами
    const lessonStatuses = ['COMPLETED', 'PAID', 'SCHEDULED'];
    const costs = [1200, 1500, 1800, 2000, 2200, 2500, 2800, 3000];
    const notes = [
      'Отличная работа на занятии',
      'Ребенок был внимательным',
      'Нужно больше практики дома',
      'Показывает хороший прогресс',
      'Требует дополнительного внимания',
      'Самостоятельно выполняет задания',
      'Нужна помощь родителей',
      'Очень старательный ученик',
      'Быстро усваивает материал',
      'Требует повторения пройденного'
    ];

    let addedLessons = 0;

    for (const student of students) {
      // Добавляем 5-10 дополнительных занятий для каждого ученика
      const additionalLessons = Math.floor(Math.random() * 6) + 5;
      
      for (let i = 0; i < additionalLessons; i++) {
        // Создаем даты в разных периодах
        const date = new Date();
        const daysAgo = Math.floor(Math.random() * 180); // Последние 6 месяцев
        date.setDate(date.getDate() - daysAgo);
        
        // Устанавливаем время занятия (9:00 - 17:00)
        const hour = 9 + Math.floor(Math.random() * 8);
        const minute = Math.random() < 0.5 ? 0 : 30;
        date.setHours(hour, minute, 0, 0);

        const status = lessonStatuses[Math.floor(Math.random() * lessonStatuses.length)];
        const cost = costs[Math.floor(Math.random() * costs.length)];
        const note = Math.random() < 0.8 ? notes[Math.floor(Math.random() * notes.length)] : null;

        // Проверяем, нет ли уже занятия в это время
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
              notes: note
            }
          });
          addedLessons++;
        }
      }
    }

    console.log(`✅ Добавлено занятий: ${addedLessons}`);

    // Обновляем статистику
    const stats = await prisma.lesson.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { cost: true }
    });

    console.log('\n📈 Обновленная статистика:');
    stats.forEach(stat => {
      console.log(`${stat.status}: ${stat._count.id} занятий, ${stat._sum.cost || 0} ₽`);
    });

    const totalRevenue = stats.reduce((sum, stat) => sum + (stat._sum.cost || 0), 0);
    console.log(`💰 Общая выручка: ${totalRevenue} ₽`);

    // Статистика по пользователям
    console.log('\n👥 Статистика по пользователям:');
    for (const student of students) {
      const userLessons = await prisma.lesson.findMany({
        where: {
          student: {
            userId: student.userId
          }
        }
      });

      const userRevenue = userLessons
        .filter(l => l.status === 'PAID')
        .reduce((sum, l) => sum + l.cost, 0);

      const userDebt = userLessons
        .filter(l => l.status === 'COMPLETED')
        .reduce((sum, l) => sum + l.cost, 0);

      console.log(`${student.user.name}: ${userLessons.length} занятий, ${userRevenue} ₽ выручка, ${userDebt} ₽ долг`);
    }

    console.log('\n🎉 Дополнительные финансовые данные добавлены!');

  } catch (error) {
    console.error('❌ Ошибка при добавлении данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMoreFinancialData();
