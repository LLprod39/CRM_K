import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { updateAllStudentBalances } from '@/lib/balanceUtils'

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Нет прав доступа' },
        { status: 403 }
      )
    }

    await updateAllStudentBalances()

    return NextResponse.json({
      message: 'Балансы всех учеников успешно синхронизированы'
    })
  } catch (error) {
    console.error('Ошибка при синхронизации балансов:', error)
    return NextResponse.json(
      { error: 'Не удалось синхронизировать балансы' },
      { status: 500 }
    )
  }
}
