import { prisma } from '@/lib/db'

/**
 * Обновляет баланс ученика на основе его уроков
 * Баланс = предоплаченные уроки - задолженности
 */
export async function updateStudentBalance(studentId: number): Promise<number> {
  try {
    // Получаем все уроки ученика
    const lessons = await prisma.lesson.findMany({
      where: { studentId },
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
      where: { id: studentId },
      data: { balance }
    })

    return balance
  } catch (error) {
    console.error('Ошибка при обновлении баланса ученика:', error)
    throw error
  }
}

/**
 * Обновляет балансы всех учеников
 */
export async function updateAllStudentBalances(): Promise<void> {
  try {
    const students = await prisma.student.findMany({
      select: { id: true }
    })

    await Promise.all(
      students.map(student => updateStudentBalance(student.id))
    )
  } catch (error) {
    console.error('Ошибка при обновлении балансов всех учеников:', error)
    throw error
  }
}

/**
 * Получает детальную информацию о балансе ученика
 */
export async function getStudentBalanceInfo(studentId: number) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        lessons: {
          select: {
            id: true,
            cost: true,
            isPaid: true,
            isCompleted: true,
            isCancelled: true,
            date: true
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            date: true,
            description: true,
            type: true
          },
          orderBy: {
            date: 'desc'
          }
        }
      }
    })

    if (!student) {
      throw new Error('Ученик не найден')
    }

    const prepaidLessons = student.lessons.filter(lesson => 
      lesson.isPaid && !lesson.isCompleted && !lesson.isCancelled
    )
    
    const debtLessons = student.lessons.filter(lesson => 
      lesson.isCompleted && !lesson.isPaid && !lesson.isCancelled
    )

    const prepaidAmount = prepaidLessons.reduce((sum, lesson) => sum + lesson.cost, 0)
    const debtAmount = debtLessons.reduce((sum, lesson) => sum + lesson.cost, 0)
    const balance = prepaidAmount - debtAmount

    return {
      student: {
        id: student.id,
        fullName: student.fullName,
        parentName: student.parentName,
        phone: student.phone,
        balance: student.balance
      },
      calculatedBalance: balance,
      prepaidAmount,
      debtAmount,
      prepaidLessonsCount: prepaidLessons.length,
      debtLessonsCount: debtLessons.length,
      paymentHistory: student.payments,
      lastPaymentDate: student.payments.length > 0 ? student.payments[0].date : null
    }
  } catch (error) {
    console.error('Ошибка при получении информации о балансе ученика:', error)
    throw error
  }
}
