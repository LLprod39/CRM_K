const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAISetup() {
  try {
    console.log('🔍 Проверка настройки ИИ...\n');

    // Проверяем наличие игрушек
    const toysCount = await prisma.toy.count();
    console.log(`✅ Игрушки в базе: ${toysCount}`);

    if (toysCount > 0) {
      const toys = await prisma.toy.findMany({ take: 3 });
      console.log('📦 Примеры игрушек:');
      toys.forEach(toy => {
        console.log(`   - ${toy.name} (${toy.category || 'без категории'})`);
      });
    }

    // Проверяем наличие учеников
    const studentsCount = await prisma.student.count();
    console.log(`\n👥 Ученики в базе: ${studentsCount}`);

    if (studentsCount > 0) {
      const students = await prisma.student.findMany({ 
        take: 3,
        include: {
          lessons: {
            where: { isCompleted: true },
            take: 2
          }
        }
      });
      console.log('🎓 Примеры учеников:');
      students.forEach(student => {
        console.log(`   - ${student.fullName} (${student.age} лет, ${student.lessons.length} занятий)`);
      });
    }

    // Проверяем занятия
    const lessonsCount = await prisma.lesson.count();
    console.log(`\n📚 Занятия в базе: ${lessonsCount}`);

    console.log('\n✅ Система готова для работы с ИИ!');
    console.log('\n📋 Что можно протестировать:');
    console.log('1. Откройте профиль любого ученика');
    console.log('2. Найдите раздел "Предложения занятий от ИИ"');
    console.log('3. Нажмите "Сгенерировать план"');
    console.log('4. В админ-панели перейдите на вкладку "Игрушки"');

  } catch (error) {
    console.error('❌ Ошибка при проверке:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAISetup();
