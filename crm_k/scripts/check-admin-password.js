const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

// Устанавливаем переменную окружения для dev.db
process.env.DATABASE_URL = 'file:./prisma/dev.db'

const prisma = new PrismaClient()

async function checkAndUpdateAdminPassword() {
  try {
    console.log('🔍 Проверяем пароль админа...')
    
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@crm.com' }
    })
    
    if (!admin) {
      console.log('❌ Админ не найден')
      return
    }
    
    console.log('👤 Текущий админ:')
    console.log(`   Email: ${admin.email}`)
    console.log(`   Имя: ${admin.name}`)
    console.log(`   Роль: ${admin.role}`)
    
    // Проверяем пароль 123456
    console.log('🔐 Проверяем пароль 123456...')
    const isValid = await bcrypt.compare('123456', admin.password)
    console.log(`   Пароль 123456 правильный: ${isValid ? '✅ ДА' : '❌ НЕТ'}`)
    
    if (!isValid) {
      console.log('🔄 Обновляем пароль на 123456...')
      const newHash = await bcrypt.hash('123456', 12)
      
      await prisma.user.update({
        where: { id: admin.id },
        data: { password: newHash }
      })
      
      console.log('✅ Пароль успешно обновлен на 123456')
      
      // Проверяем новый пароль
      const updatedAdmin = await prisma.user.findUnique({
        where: { email: 'admin@crm.com' }
      })
      
      const isNewPasswordValid = await bcrypt.compare('123456', updatedAdmin.password)
      console.log(`   Новый пароль работает: ${isNewPasswordValid ? '✅ ДА' : '❌ НЕТ'}`)
    } else {
      console.log('✅ Пароль уже установлен как 123456')
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке/обновлении пароля:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAndUpdateAdminPassword()
