const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkFinalData() {
  try {
    console.log('📊 Проверка финальных данных...\n');

    // Общая статистика
    const totalUsers = await prisma.user.count();
    const totalStudents = await prisma.student.count();
    const totalLessons = await prisma.lesson.count();

    console.log('📈 Общая статистика:');
    console.log(`👥 Пользователей: ${totalUsers}`);
    console.log(`👶 Учеников: ${totalStudents}`);
    console.log(`📚 Занятий: ${totalLessons}`);

    // Статистика по статусам занятий
    const lessonStats = await prisma.lesson.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { cost: true }
    });

    console.log('\n📚 Статистика занятий:');
    lessonStats.forEach(stat => {
      console.log(`${stat.status}: ${stat._count.id} занятий, ${stat._sum.cost || 0} ₸`);
    });

    const totalRevenue = lessonStats.reduce((sum, stat) => sum + (stat._sum.cost || 0), 0);
    console.log(`💰 Общая стоимость: ${totalRevenue} ₸`);

    // Статистика по пользователям
    console.log('\n👥 Детальная статистика по пользователям:');
    const users = await prisma.user.findMany({
      include: {
        students: {
          include: {
            lessons: true
          }
        }
      }
    });

    for (const user of users) {
      const paidLessons = user.students.flatMap(s => s.lessons).filter(l => l.status === 'PAID');
      const completedLessons = user.students.flatMap(s => s.lessons).filter(l => l.status === 'COMPLETED');
      const scheduledLessons = user.students.flatMap(s => s.lessons).filter(l => l.status === 'SCHEDULED');
      const cancelledLessons = user.students.flatMap(s => s.lessons).filter(l => l.status === 'CANCELLED');

      const revenue = paidLessons.reduce((sum, l) => sum + l.cost, 0);
      const debt = completedLessons.reduce((sum, l) => sum + l.cost, 0);

      console.log(`\n${user.name} (${user.email}):`);
      console.log(`  👶 Учеников: ${user.students.length}`);
      console.log(`  📚 Всего занятий: ${user.students.flatMap(s => s.lessons).length}`);
      console.log(`  ✅ Оплачено: ${paidLessons.length} (${revenue} ₸)`);
      console.log(`  ⏳ Проведено: ${completedLessons.length} (${debt} ₸ долг)`);
      console.log(`  📅 Запланировано: ${scheduledLessons.length}`);
      console.log(`  ❌ Отменено: ${cancelledLessons.length}`);
    }

    // Топ учеников по выручке
    console.log('\n🏆 Топ учеников по выручке:');
    const topStudents = await prisma.student.findMany({
      include: {
        lessons: true,
        user: {
          select: {
            name: true
          }
        }
      }
    });

    const studentsWithRevenue = topStudents.map(student => {
      const paidLessons = student.lessons.filter(l => l.status === 'PAID');
      const revenue = paidLessons.reduce((sum, l) => sum + l.cost, 0);
      return {
        name: student.fullName,
        owner: student.user.name,
        revenue,
        lessons: paidLessons.length
      };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    studentsWithRevenue.forEach((student, index) => {
      console.log(`${index + 1}. ${student.name} (${student.owner}): ${student.revenue} ₸ (${student.lessons} занятий)`);
    });

    console.log('\n🎉 Данные готовы для тестирования!');
    console.log('\n🔑 Учетные данные:');
    console.log('Админ: admin@crm.com / admin123');
    console.log('Учитель 1: teacher1@test.com / teacher123');
    console.log('Учитель 2: teacher2@test.com / teacher123');
    console.log('Учитель 3: teacher3@test.com / teacher123');
    console.log('Тестовый: user@test.com / user123');

  } catch (error) {
    console.error('❌ Ошибка при проверке данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFinalData();
