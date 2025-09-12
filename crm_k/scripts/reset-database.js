const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function resetDatabase() {
  try {
    console.log('🔄 Сброс базы данных...')
    
    // Очищаем все таблицы
    await prisma.aISuggestion.deleteMany()
    await prisma.lunchBreak.deleteMany()
    await prisma.paymentLesson.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.lesson.deleteMany()
    await prisma.toy.deleteMany()
    await prisma.student.deleteMany()
    await prisma.user.deleteMany()
    
    console.log('✅ База данных очищена')
    
    // Хешируем пароли
    const adminPassword = await bcrypt.hash('123456', 10)
    const userPassword = await bcrypt.hash('123456', 10)
    
    // Создаем пользователей
    const admin = await prisma.user.create({
      data: {
        email: 'admin@crm.com',
        password: adminPassword,
        name: 'Администратор',
        role: 'ADMIN'
      }
    })
    
    const user = await prisma.user.create({
      data: {
        email: 'user@crm.com',
        password: userPassword,
        name: 'Тестовый пользователь',
        role: 'USER'
      }
    })
    
    console.log('👑 Админ создан:', admin.email)
    console.log('👤 Пользователь создан:', user.email)
    
    // Создаем несколько тестовых игрушек
    const toys = await prisma.toy.createMany({
      data: [
        { name: 'Кубики', description: 'Развивающие кубики', category: 'Развивающие' },
        { name: 'Пазлы', description: 'Детские пазлы', category: 'Развивающие' },
        { name: 'Мяч', description: 'Резиновый мяч', category: 'Спортивные' },
        { name: 'Книга', description: 'Детская книга', category: 'Образовательные' }
      ]
    })
    
    console.log('🧸 Создано игрушек:', toys.count)
    
    console.log('\n🎉 База данных сброшена!')
    console.log('📋 Аккаунты для входа:')
    console.log('👑 Админ: admin@crm.com / admin123')
    console.log('👤 Пользователь: user@crm.com / user123')
    
  } catch (error) {
    console.error('❌ Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetDatabase()
