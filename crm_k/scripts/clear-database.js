const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('🧹 Начинаю очистку базы данных...');
    
    // Удаляем все данные в правильном порядке (с учетом внешних ключей)
    console.log('📚 Удаляю связи платежей и уроков...');
    await prisma.paymentLesson.deleteMany();
    
    console.log('💰 Удаляю платежи...');
    await prisma.payment.deleteMany();
    
    console.log('📅 Удаляю уроки...');
    await prisma.lesson.deleteMany();
    
    console.log('👥 Удаляю учеников...');
    await prisma.student.deleteMany();
    
    console.log('👤 Удаляю всех пользователей кроме админа...');
    // Удаляем всех пользователей кроме админа
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (adminUser) {
      // Удаляем всех пользователей кроме админа
      await prisma.user.deleteMany({
        where: {
          id: { not: adminUser.id }
        }
      });
      console.log(`✅ Админ сохранен: ${adminUser.email}`);
    } else {
      console.log('⚠️  Админ не найден в базе данных');
    }
    
    console.log('✅ База данных успешно очищена!');
    
    // Показываем статистику
    const userCount = await prisma.user.count();
    const studentCount = await prisma.student.count();
    const lessonCount = await prisma.lesson.count();
    const paymentCount = await prisma.payment.count();
    
    console.log('\n📊 Статистика после очистки:');
    console.log(`👤 Пользователи: ${userCount}`);
    console.log(`👥 Ученики: ${studentCount}`);
    console.log(`📅 Уроки: ${lessonCount}`);
    console.log(`💰 Платежи: ${paymentCount}`);
    
  } catch (error) {
    console.error('❌ Ошибка при очистке базы данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
