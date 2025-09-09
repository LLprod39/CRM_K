const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('👤 Создаю тестового пользователя...');
    
    // Проверяем, существует ли уже пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });
    
    if (existingUser) {
      console.log('⚠️  Пользователь test@example.com уже существует');
      return;
    }
    
    // Хешируем пароль
    const hashedPassword = await bcrypt.hash('test123', 12);
    
    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        name: 'Тестовый Пользователь',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'USER'
      }
    });
    
    console.log('✅ Тестовый пользователь создан:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Пароль: test123`);
    console.log(`   Роль: ${user.role}`);
    
  } catch (error) {
    console.error('❌ Ошибка при создании тестового пользователя:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
