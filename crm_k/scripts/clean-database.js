const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function cleanDatabase() {
  try {
    console.log('🧹 Начинаем очистку базы данных...')
    
    // Удаляем все данные в правильном порядке (с учетом внешних ключей)
    console.log('📚 Удаляем предложения ИИ...')
    await prisma.aISuggestion.deleteMany()
    
    console.log('🍽️ Удаляем перерывы на обед...')
    await prisma.lunchBreak.deleteMany()
    
    console.log('🎯 Удаляем связи платежей и уроков...')
    await prisma.paymentLesson.deleteMany()
    
    console.log('💰 Удаляем платежи...')
    await prisma.payment.deleteMany()
    
    console.log('📖 Удаляем уроки...')
    await prisma.lesson.deleteMany()
    
    console.log('🧸 Удаляем игрушки...')
    await prisma.toy.deleteMany()
    
    console.log('👨‍🎓 Удаляем учеников...')
    await prisma.student.deleteMany()
    
    console.log('👤 Удаляем пользователей...')
    await prisma.user.deleteMany()
    
    console.log('✅ База данных очищена!')
    
    // Хешируем пароль
    const hashedPassword = await bcrypt.hash('123456', 10)
    
    // Создаем админа
    console.log('👑 Создаем администратора...')
    const admin = await prisma.user.create({
      data: {
        email: 'admin@crm.com',
        password: hashedPassword,
        name: 'Администратор',
        role: 'ADMIN'
      }
    })
    console.log(`✅ Администратор создан: ${admin.email}`)
    
    // Создаем тестового пользователя
    console.log('👤 Создаем тестового пользователя...')
    const user = await prisma.user.create({
      data: {
        email: 'user@crm.com',
        password: hashedPassword,
        name: 'Тестовый пользователь',
        role: 'USER'
      }
    })
    console.log(`✅ Пользователь создан: ${user.email}`)
    
    console.log('🎉 Очистка базы данных завершена!')
    console.log('\n📋 Созданные аккаунты:')
    console.log('👑 Админ: admin@crm.com / 123456')
    console.log('👤 Пользователь: user@crm.com / 123456')
    
  } catch (error) {
    console.error('❌ Ошибка при очистке базы данных:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanDatabase()
