const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('🌱 Создание тестовых данных...');

    // Создаем тестового пользователя
    console.log('👤 Создаем тестового пользователя...');
    const hashedPassword = await bcrypt.hash('teacher123', 12);
    
    const user = await prisma.user.create({
      data: {
        email: 'teacher@test.com',
        password: hashedPassword,
        name: 'Тестовый Учитель',
        role: 'USER'
      }
    });

    console.log(`✅ Пользователь создан: ${user.name} (${user.email})`);

    // Создаем тестового ученика
    console.log('👶 Создаем тестового ученика...');
    const student = await prisma.student.create({
      data: {
        fullName: 'Тестовый Ученик',
        phone: '+7 (999) 123-45-67',
        age: 8,
        diagnosis: 'Тестовый диагноз',
        comment: 'Тестовый комментарий',
        userId: user.id
      }
    });

    console.log(`✅ Ученик создан: ${student.fullName}`);

    // Создаем несколько тестовых занятий
    console.log('📚 Создаем тестовые занятия...');
    const now = new Date();
    
    // Запланированное занятие (завтра)
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    await prisma.lesson.create({
      data: {
        date: tomorrow,
        studentId: student.id,
        cost: 2000,
        isCompleted: false,
        isPaid: false,
        isCancelled: false,
        notes: 'Запланированное занятие'
      }
    });

    // Проведенное занятие (вчера)
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    yesterday.setHours(14, 0, 0, 0);

    await prisma.lesson.create({
      data: {
        date: yesterday,
        studentId: student.id,
        cost: 2000,
        isCompleted: true,
        isPaid: false,
        isCancelled: false,
        notes: 'Проведенное занятие'
      }
    });

    // Оплаченное занятие (позавчера)
    const dayBeforeYesterday = new Date(now);
    dayBeforeYesterday.setDate(now.getDate() - 2);
    dayBeforeYesterday.setHours(16, 0, 0, 0);

    await prisma.lesson.create({
      data: {
        date: dayBeforeYesterday,
        studentId: student.id,
        cost: 2000,
        isCompleted: true,
        isPaid: true,
        isCancelled: false,
        notes: 'Проведенное + Оплаченное занятие'
      }
    });

    console.log('✅ Тестовые занятия созданы');

    console.log('\n🎉 Тестовые данные созданы!');
    console.log('\n📋 Учетные данные для входа:');
    console.log('Админ: admin@crm.com / 123456');
    console.log('Учитель: teacher@test.com / teacher123');

  } catch (error) {
    console.error('❌ Ошибка при создании тестовых данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
