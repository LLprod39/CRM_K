const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

// Используем dev.db как указано в .env
process.env.DATABASE_URL = 'file:./prisma/dev.db'

const prisma = new PrismaClient()

async function setupAdmin() {
  try {
    console.log('🔍 Проверяем существование админа...')
    
    // Проверяем, существует ли уже админ
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@crm.com' }
    })

    if (existingAdmin) {
      console.log('✅ Админ admin@crm.com уже существует')
      console.log(`   ID: ${existingAdmin.id}`)
      console.log(`   Имя: ${existingAdmin.name}`)
      console.log(`   Роль: ${existingAdmin.role}`)
      
      // Проверяем пароль
      const isValidPassword = await bcrypt.compare('123456', existingAdmin.password)
      if (!isValidPassword) {
        console.log('🔄 Обновляем пароль на 123456...')
        const passwordHash = await bcrypt.hash('123456', 12)
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: { password: passwordHash }
        })
        console.log('✅ Пароль обновлен на 123456')
      } else {
        console.log('✅ Пароль уже правильный: 123456')
      }
      return
    }

    console.log('👤 Создаем админа admin@crm.com...')
    
    // Хешируем пароль
    const passwordHash = await bcrypt.hash('123456', 12)
    
    // Создаем админа
    const admin = await prisma.user.create({
      data: {
        email: 'admin@crm.com',
        password: passwordHash,
        name: 'Admin CRM',
        role: 'ADMIN'
      }
    })

    console.log('✅ Админ успешно создан!')
    console.log(`   ID: ${admin.id}`)
    console.log(`   Email: ${admin.email}`)
    console.log(`   Имя: ${admin.name}`)
    console.log(`   Роль: ${admin.role}`)
    console.log('   Пароль: 123456')
    
  } catch (error) {
    console.error('❌ Ошибка при создании админа:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Запускаем только если файл вызван напрямую
if (require.main === module) {
  setupAdmin()
}

module.exports = { setupAdmin }
