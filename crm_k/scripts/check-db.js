const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Проверка базы данных...\n');

    const userCount = await prisma.user.count();
    const studentCount = await prisma.student.count();
    const lessonCount = await prisma.lesson.count();

    console.log(`👥 Пользователей: ${userCount}`);
    console.log(`👶 Учеников: ${studentCount}`);
    console.log(`📚 Занятий: ${lessonCount}`);

    if (userCount === 0) {
      console.log('\n❌ Нет пользователей в базе данных!');
      console.log('Запустите: node scripts/seed-test-data.js');
    } else {
      console.log('\n✅ Данные в базе есть');
      
      // Показываем пользователей
      const users = await prisma.user.findMany();
      console.log('\n👥 Пользователи:');
      users.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
      });
    }

  } catch (error) {
    console.error('❌ Ошибка при проверке базы данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
