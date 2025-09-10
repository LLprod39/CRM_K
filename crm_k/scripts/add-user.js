const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function addUser() {
  try {
    console.log('👤 Добавление пользователя...');

    const email = 'user@crm.com';
    const password = '123456';
    const name = 'Пользователь CRM';

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log(`❌ Пользователь с email ${email} уже существует`);
      return;
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 12);

    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'USER'
      }
    });

    console.log(`✅ Пользователь создан:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Имя: ${user.name}`);
    console.log(`   Роль: ${user.role}`);
    console.log(`   ID: ${user.id}`);

  } catch (error) {
    console.error('❌ Ошибка при создании пользователя:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addUser();
