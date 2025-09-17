const { PrismaClient } = require('@prisma/client')

// Используем dev.db как указано в .env
process.env.DATABASE_URL = 'file:./prisma/dev.db'
const prisma = new PrismaClient()

async function checkAdmin() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@crm.com' }
    })
    
    if (admin) {
      console.log('✅ Админ найден в dev.db:')
      console.log(`   ID: ${admin.id}`)
      console.log(`   Email: ${admin.email}`)
      console.log(`   Имя: ${admin.name}`)
      console.log(`   Роль: ${admin.role}`)
    } else {
      console.log('❌ Админ не найден в dev.db')
    }
  } catch (error) {
    console.error('Ошибка при проверке админа:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdmin()
