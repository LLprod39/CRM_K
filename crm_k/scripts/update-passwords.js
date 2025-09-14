const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function updatePasswords() {
  try {
    console.log('🔐 Обновляем пароли пользователей...')
    
    // Хешируем новый пароль
    const newPassword = await bcrypt.hash('123456', 10)
    
    // Обновляем пароль админа
    const admin = await prisma.user.update({
      where: { email: 'admin@crm.com' },
      data: { password: newPassword }
    })
    console.log('✅ Пароль админа обновлен:', admin.email)
    
    // Обновляем пароль пользователя
    const user = await prisma.user.update({
      where: { email: 'user@crm.com' },
      data: { password: newPassword }
    })
    console.log('✅ Пароль пользователя обновлен:', user.email)
    
    console.log('\n🎉 Пароли успешно обновлены!')
    console.log('📋 Аккаунты для входа:')
    console.log('👑 Админ: admin@crm.com / 123456')
    console.log('👤 Пользователь: user@crm.com / 123456')
    
  } catch (error) {
    console.error('❌ Ошибка при обновлении паролей:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updatePasswords()
