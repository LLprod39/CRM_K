const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updateAdminPassword() {
  try {
    const hashedPassword = await bcrypt.hash('123456', 12);
    
    await prisma.user.update({
      where: { email: 'admin@crm.com' },
      data: { password: hashedPassword }
    });
    
    console.log('Пароль админа обновлен: 123456');
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword();
