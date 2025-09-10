const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('🧹 Очистка базы данных...');

    // Удаляем все данные в правильном порядке (с учетом внешних ключей)
    console.log('🗑️ Удаляем все платежи...');
    await prisma.paymentLesson.deleteMany();
    await prisma.payment.deleteMany();

    console.log('🗑️ Удаляем все занятия...');
    await prisma.lesson.deleteMany();

    console.log('🗑️ Удаляем всех учеников...');
    await prisma.student.deleteMany();

    console.log('🗑️ Удаляем всех пользователей...');
    await prisma.user.deleteMany();

    // Создаем только админа с паролем 123456
    console.log('👤 Создаем администратора...');
    const hashedPassword = await bcrypt.hash('123456', 12);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@crm.com',
        password: hashedPassword,
        name: 'Администратор',
        role: 'ADMIN'
      }
    });

    console.log('✅ Администратор создан:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Пароль: 123456`);
    console.log(`   Роль: ${admin.role}`);

    console.log('\n🎉 База данных очищена! Остался только администратор.');
    console.log('\n📋 Учетные данные для входа:');
    console.log('Email: admin@crm.com');
    console.log('Пароль: 123456');

  } catch (error) {
    console.error('❌ Ошибка при очистке базы данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();