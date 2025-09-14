const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAdminRestrictions() {
  try {
    console.log('🧪 Тестирование ограничений для администраторов...\n')
    
    // 1. Проверяем, что у админов нет назначенных учеников
    console.log('1️⃣ Проверка назначенных учеников у админов:')
    const adminsWithStudents = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      },
      include: {
        students: true
      }
    })

    for (const admin of adminsWithStudents) {
      if (admin.students.length > 0) {
        console.log(`   ❌ Админ "${admin.name}" имеет ${admin.students.length} назначенных учеников`)
      } else {
        console.log(`   ✅ Админ "${admin.name}" не имеет назначенных учеников`)
      }
    }

    // 2. Проверяем общее количество учеников в системе
    console.log('\n2️⃣ Общая статистика учеников:')
    const totalStudents = await prisma.student.count()
    const assignedStudents = await prisma.student.count({
      where: {
        isAssigned: true,
        userId: { not: null }
      }
    })
    const unassignedStudents = await prisma.student.count({
      where: {
        isAssigned: false,
        userId: null
      }
    })

    console.log(`   📊 Всего учеников: ${totalStudents}`)
    console.log(`   ✅ Назначенных учителям: ${assignedStudents}`)
    console.log(`   🔄 Не назначенных (доступных для назначения): ${unassignedStudents}`)

    // 3. Проверяем количество учителей (не админов)
    console.log('\n3️⃣ Информация об учителях:')
    const teachers = await prisma.user.findMany({
      where: {
        role: 'USER'
      },
      include: {
        _count: {
          select: {
            students: true
          }
        }
      }
    })

    console.log(`   👥 Всего учителей: ${teachers.length}`)
    for (const teacher of teachers) {
      console.log(`   👤 ${teacher.name} (${teacher.email}): ${teacher._count.students} учеников`)
    }

    // 4. Проверяем уроки
    console.log('\n4️⃣ Проверка занятий:')
    const lessonsWithAdminStudents = await prisma.lesson.findMany({
      where: {
        student: {
          user: {
            role: 'ADMIN'
          }
        }
      },
      include: {
        student: {
          include: {
            user: true
          }
        }
      }
    })

    if (lessonsWithAdminStudents.length > 0) {
      console.log(`   ❌ Найдено ${lessonsWithAdminStudents.length} занятий у учеников админов`)
      for (const lesson of lessonsWithAdminStudents) {
        console.log(`      - Занятие #${lesson.id} у ученика "${lesson.student.fullName}" админа "${lesson.student.user?.name}"`)
      }
    } else {
      console.log(`   ✅ Нет занятий у учеников админов`)
    }

    // 5. Итоговая оценка
    console.log('\n📋 ИТОГОВАЯ ОЦЕНКА:')
    const hasAdminsWithStudents = adminsWithStudents.some(admin => admin.students.length > 0)
    const hasLessonsWithAdminStudents = lessonsWithAdminStudents.length > 0

    if (!hasAdminsWithStudents && !hasLessonsWithAdminStudents) {
      console.log('✅ Все ограничения для админов выполнены успешно!')
      console.log('   - Админы не имеют назначенных учеников')
      console.log('   - Нет занятий у учеников админов')
      console.log('   - Система готова к работе')
    } else {
      console.log('❌ Обнаружены проблемы с ограничениями админов')
      if (hasAdminsWithStudents) {
        console.log('   - Найдены админы с назначенными учениками')
      }
      if (hasLessonsWithAdminStudents) {
        console.log('   - Найдены занятия у учеников админов')
      }
    }

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAdminRestrictions()
