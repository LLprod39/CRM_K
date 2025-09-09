const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkPasswords() {
  try {
    console.log('Проверяем пользователей в базе данных...');
    
    const users = await prisma.user.findMany();
    console.log(`Найдено пользователей: ${users.length}`);
    
    for (const user of users) {
      console.log(`\nПользователь: ${user.email}`);
      console.log(`Имя: ${user.name}`);
      console.log(`Роль: ${user.role}`);
      console.log(`Хеш пароля: ${user.password}`);
      
      // Проверяем пароль admin123
      const isAdminPasswordValid = await bcrypt.compare('admin123', user.password);
      console.log(`Пароль admin123 валиден: ${isAdminPasswordValid}`);
      
      // Проверяем пароль user123
      const isUserPasswordValid = await bcrypt.compare('user123', user.password);
      console.log(`Пароль user123 валиден: ${isUserPasswordValid}`);
    }
    
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPasswords();
