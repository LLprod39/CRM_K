const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function syncStudentBalances() {
  try {
    console.log('🔄 Начинаем синхронизацию балансов учеников...')
    
    // Получаем всех учеников
    const students = await prisma.student.findMany({
      select: { id: true, fullName: true }
    })
    
    console.log(`📊 Найдено ${students.length} учеников`)
    
    let updatedCount = 0
    
    for (const student of students) {
      try {
        // Получаем все уроки ученика
        const lessons = await prisma.lesson.findMany({
          where: { studentId: student.id },
          select: {
            id: true,
            cost: true,
            isPaid: true,
            isCompleted: true,
            isCancelled: true
          }
        })

        // Рассчитываем предоплату (оплаченные, но не проведенные уроки)
        const prepaidAmount = lessons
          .filter(lesson => lesson.isPaid && !lesson.isCompleted && !lesson.isCancelled)
          .reduce((sum, lesson) => sum + lesson.cost, 0)

        // Рассчитываем задолженность (проведенные, но не оплаченные уроки)
        const debtAmount = lessons
          .filter(lesson => lesson.isCompleted && !lesson.isPaid && !lesson.isCancelled)
          .reduce((sum, lesson) => sum + lesson.cost, 0)

        // Баланс = предоплата - задолженность
        const balance = prepaidAmount - debtAmount

        // Обновляем баланс в базе данных
        await prisma.student.update({
          where: { id: student.id },
          data: { balance }
        })

        console.log(`✅ ${student.fullName}: баланс ${balance.toLocaleString()} ₸ (предоплата: ${prepaidAmount.toLocaleString()} ₸, задолженность: ${debtAmount.toLocaleString()} ₸)`)
        updatedCount++
        
      } catch (error) {
        console.error(`❌ Ошибка при обновлении баланса для ${student.fullName}:`, error.message)
      }
    }
    
    console.log(`\n🎉 Синхронизация завершена! Обновлено ${updatedCount} из ${students.length} учеников`)
    
  } catch (error) {
    console.error('❌ Ошибка при синхронизации балансов:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Запускаем синхронизацию
syncStudentBalances()
