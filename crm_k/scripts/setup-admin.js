const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupAdmin() {
  try {
    // Проверяем, есть ли уже админ
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@crm.com' }
    });

    if (existingAdmin) {
      console.log('Админ уже существует, обновляем пароль...');
      const hashedPassword = await bcrypt.hash('123456', 12);
      
      await prisma.user.update({
        where: { email: 'admin@crm.com' },
        data: { password: hashedPassword }
      });
      
      console.log('✅ Пароль админа обновлен: 123456');
    } else {
      console.log('Создаем нового админа...');
      const hashedPassword = await bcrypt.hash('123456', 12);
      
      await prisma.user.create({
        data: {
          email: 'admin@crm.com',
          password: hashedPassword,
          name: 'Администратор',
          role: 'ADMIN'
        }
      });
      
      console.log('✅ Админ создан: admin@crm.com / 123456');
    }

    // Создаем тестового пользователя
    const existingUser = await prisma.user.findUnique({
      where: { email: 'user@test.com' }
    });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('user123', 12);
      
      await prisma.user.create({
        data: {
          email: 'user@test.com',
          password: hashedPassword,
          name: 'Тестовый пользователь',
          role: 'USER'
        }
      });
      
      console.log('✅ Тестовый пользователь создан: user@test.com / user123');
    }

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin();
