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
        parentName: 'Тестовая Мама',
        userId: user.id
      }
    });

    console.log(`✅ Ученик создан: ${student.fullName}`);

    // Создаем несколько тестовых занятий
    console.log('📚 Создаем тестовые занятия...');
    const now = new Date();
    
    // Создаем занятия за последние 30 дней для графика
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
        
        await prisma.lesson.create({
          data: {
            date: lessonTime,
            studentId: student.id,
            cost: 2000 + Math.floor(Math.random() * 1000), // Стоимость от 2000 до 3000
            isCompleted,
            isPaid,
            isCancelled: false,
            notes: `Тестовое занятие ${i + 1}-${j + 1}`
          }
        });
      }
    }

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
