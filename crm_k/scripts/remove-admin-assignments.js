const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function removeAdminAssignments() {
  try {
    console.log('🔍 Поиск администраторов с назначенными учениками...')
    
    // Найти всех админов
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      },
      include: {
        students: true
      }
    })

    console.log(`📊 Найдено админов: ${admins.length}`)

    for (const admin of admins) {
      if (admin.students.length > 0) {
        console.log(`👤 Админ "${admin.name}" (${admin.email}) имеет ${admin.students.length} назначенных учеников`)
        
        // Отменяем назначение всех учеников у админа
        const updatedStudents = await prisma.student.updateMany({
          where: {
            userId: admin.id
          },
          data: {
            userId: null,
            isAssigned: false
          }
        })

        console.log(`   ✅ Отменено назначение ${updatedStudents.count} учеников`)
      } else {
        console.log(`👤 Админ "${admin.name}" (${admin.email}) не имеет назначенных учеников`)
      }
    }

    // Проверим, остались ли ученики у админов
    const remainingAssignments = await prisma.student.count({
      where: {
        user: {
          role: 'ADMIN'
        }
      }
    })

    if (remainingAssignments === 0) {
      console.log('✅ Все назначения учеников у администраторов успешно удалены')
    } else {
      console.log(`⚠️  Внимание: остались ${remainingAssignments} назначений у администраторов`)
    }

  } catch (error) {
    console.error('❌ Ошибка при удалении назначений:', error)
  } finally {
    await prisma.$disconnect()
  }
}

removeAdminAssignments()
