const { PrismaClient } = require('@prisma/client')

// Используем ту же логику, что и сервер
const databaseUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db'
console.log(`🔍 Используемая база данных: ${databaseUrl}`)

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
})

async function checkServerDatabase() {
  try {
    console.log('🔍 Проверяем базу данных сервера...')
    
    // Проверяем, какие таблицы есть
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table';
    `
    console.log('📋 Таблицы в базе данных:')
    tables.forEach(table => console.log(`   - ${table.name}`))
    
    // Проверяем админа
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@crm.com' }
    })
    
    if (admin) {
      console.log('✅ Админ найден в базе данных сервера:')
      console.log(`   ID: ${admin.id}`)
      console.log(`   Email: ${admin.email}`)
      console.log(`   Имя: ${admin.name}`)
      console.log(`   Роль: ${admin.role}`)
    } else {
      console.log('❌ Админ НЕ найден в базе данных сервера')
      
      // Проверяем всех пользователей
      const users = await prisma.user.findMany()
      console.log(`📊 Всего пользователей в базе: ${users.length}`)
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.role})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке базы данных:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkServerDatabase()
