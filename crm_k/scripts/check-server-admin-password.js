const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

// Используем ту же логику, что и сервер
const databaseUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
})

async function checkAdminPassword() {
  try {
    console.log('🔍 Проверяем пароль админа в базе данных сервера...')
    
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@crm.com' }
    })
    
    if (!admin) {
      console.log('❌ Админ не найден')
      return
    }
    
    console.log('👤 Админ найден:')
    console.log(`   Email: ${admin.email}`)
    console.log(`   Имя: ${admin.name}`)
    console.log(`   Роль: ${admin.role}`)
    
    // Проверяем пароль 123456
    console.log('🔐 Проверяем пароль 123456...')
    const isValid = await bcrypt.compare('123456', admin.password)
    console.log(`   Пароль 123456 правильный: ${isValid ? '✅ ДА' : '❌ НЕТ'}`)
    
    if (!isValid) {
      console.log('🔄 Обновляем пароль на 123456...')
      const passwordHash = await bcrypt.hash('123456', 12)
      
      await prisma.user.update({
        where: { id: admin.id },
        data: { password: passwordHash }
      })
      
      console.log('✅ Пароль обновлен на 123456')
      
      // Проверяем новый пароль
      const updatedAdmin = await prisma.user.findUnique({
        where: { email: 'admin@crm.com' }
      })
      
      const isNewPasswordValid = await bcrypt.compare('123456', updatedAdmin.password)
      console.log(`   Новый пароль работает: ${isNewPasswordValid ? '✅ ДА' : '❌ НЕТ'}`)
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке пароля:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdminPassword()
