const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixStudentDistribution() {
  try {
    console.log('🔧 Исправляем распределение учеников...');

    // Получаем всех пользователей
    const users = await prisma.user.findMany();
    const admin = users.find(u => u.role === 'ADMIN');
    const teachers = users.filter(u => u.role === 'USER');

    console.log(`👥 Найдено пользователей: ${users.length} (1 админ, ${teachers.length} учителей)`);

    // Получаем всех учеников
    const students = await prisma.student.findMany();
    console.log(`👶 Найдено учеников: ${students.length}`);

    // Распределяем учеников между учителями
    const studentsPerTeacher = Math.ceil(students.length / teachers.length);
    
    for (let i = 0; i < teachers.length; i++) {
      const teacher = teachers[i];
      const startIndex = i * studentsPerTeacher;
      const endIndex = Math.min(startIndex + studentsPerTeacher, students.length);
      const teacherStudents = students.slice(startIndex, endIndex);

      console.log(`👨‍🏫 ${teacher.name}: ${teacherStudents.length} учеников`);

      for (const student of teacherStudents) {
        await prisma.student.update({
          where: { id: student.id },
          data: { userId: teacher.id }
        });
      }
    }

    // Оставляем несколько учеников у админа
    const adminStudents = students.slice(0, 3);
    for (const student of adminStudents) {
      await prisma.student.update({
        where: { id: student.id },
        data: { userId: admin.id }
      });
    }

    console.log(`✅ Админ оставил себе: ${adminStudents.length} учеников`);

    // Проверяем распределение
    console.log('\n📊 Финальное распределение:');
    for (const user of users) {
      const userStudents = await prisma.student.findMany({
        where: { userId: user.id }
      });

      const userLessons = await prisma.lesson.findMany({
        where: {
          student: {
            userId: user.id
          }
        }
      });

      const userRevenue = userLessons
        .filter(l => l.status === 'PAID')
        .reduce((sum, l) => sum + l.cost, 0);

      const userDebt = userLessons
        .filter(l => l.status === 'COMPLETED')
        .reduce((sum, l) => sum + l.cost, 0);

      console.log(`${user.name}: ${userStudents.length} учеников, ${userLessons.length} занятий, ${userRevenue} ₽ выручка, ${userDebt} ₽ долг`);
    }

    console.log('\n🎉 Распределение учеников исправлено!');

  } catch (error) {
    console.error('❌ Ошибка при исправлении распределения:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixStudentDistribution();
