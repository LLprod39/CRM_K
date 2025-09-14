const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateLessonsTeacherId() {
  try {
    console.log('Начинаем обновление teacherId для существующих занятий...')
    
    // Получаем все занятия с информацией об учениках
    const lessons = await prisma.lesson.findMany({
      include: {
        student: {
          include: {
            user: true
          }
        }
      }
    })
    
    console.log(`Найдено ${lessons.length} занятий для обновления`)
    
    for (const lesson of lessons) {
      if (lesson.student.userId) {
        console.log(`Обновляем занятие ${lesson.id}: studentId=${lesson.studentId}, teacherId=${lesson.student.userId}`)
        
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { teacherId: lesson.student.userId }
        })
      } else {
        console.log(`Пропускаем занятие ${lesson.id}: ученик не назначен (userId=null)`)
        // Для "нечейных" учеников нужно будет назначить админа или другого учителя
        // Пока оставим как есть, но это нужно будет исправить
      }
    }
    
    console.log('Обновление завершено!')
    
  } catch (error) {
    console.error('Ошибка при обновлении:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateLessonsTeacherId()
