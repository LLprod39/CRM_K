'use client'

import { useState, useEffect } from 'react'
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card'
import Button from '../ui/Button'
import { Badge } from '../ui/Badge'
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  History, 
  RefreshCw,
  Plus,
  Minus
} from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import { cn } from '../../lib/utils'

interface StudentBalanceInfo {
  student: {
    id: number
    fullName: string
    parentName: string
    phone: string
  }
  balance: number
  prepaidAmount: number
  debtAmount: number
  prepaidLessonsCount: number
  debtLessonsCount: number
  paymentHistory: Array<{
    id: number
    amount: number
    date: string
    description: string | null
    type: string
  }>
  lastPaymentDate: string | null
}

interface StudentBalanceCardProps {
  studentId: number
  studentName: string
  className?: string
}

export default function StudentBalanceCard({ 
  studentId, 
  studentName, 
  className 
}: StudentBalanceCardProps) {
  const [balanceInfo, setBalanceInfo] = useState<StudentBalanceInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingBalance, setIsUpdatingBalance] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const { toast } = useToast()

  const fetchBalanceInfo = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/students/${studentId}/balance`)
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить информацию о балансе')
      }
      
      const data = await response.json()
      setBalanceInfo(data)
    } catch (error) {
      console.error('Ошибка при загрузке баланса:', error)
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить информацию о балансе',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateBalance = async (amount: number) => {
    try {
      setIsUpdatingBalance(true)
      const response = await fetch(`/api/students/${studentId}/balance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ balance: amount })
      })
      
      if (!response.ok) {
        throw new Error('Не удалось обновить баланс')
      }
      
      toast({
        title: 'Успешно',
        description: 'Баланс ученика обновлен'
      })
      
      await fetchBalanceInfo()
    } catch (error) {
      console.error('Ошибка при обновлении баланса:', error)
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить баланс ученика',
        variant: 'destructive'
      })
    } finally {
      setIsUpdatingBalance(false)
    }
  }

  useEffect(() => {
    fetchBalanceInfo()
  }, [studentId])

  if (isLoading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Загрузка баланса...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!balanceInfo) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Не удалось загрузить информацию о балансе
          </div>
        </CardContent>
      </Card>
    )
  }

  const { balance, prepaidAmount, debtAmount, prepaidLessonsCount, debtLessonsCount, paymentHistory } = balanceInfo

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Баланс: {studentName}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center space-x-1"
          >
            <History className="w-4 h-4" />
            <span>История</span>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Основной баланс */}
        <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {balance.toLocaleString()} ₸
          </div>
          <div className="text-sm text-gray-600">
            {balance >= 0 ? 'Предоплата' : 'Задолженность'}
          </div>
        </div>

        {/* Детализация */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Предоплата</span>
            </div>
            <div className="text-lg font-semibold text-green-900">
              {prepaidAmount.toLocaleString()} ₸
            </div>
            <div className="text-xs text-green-600">
              {prepaidLessonsCount} занятий
            </div>
          </div>
          
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center space-x-2 mb-1">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Задолженность</span>
            </div>
            <div className="text-lg font-semibold text-red-900">
              {debtAmount.toLocaleString()} ₸
            </div>
            <div className="text-xs text-red-600">
              {debtLessonsCount} занятий
            </div>
          </div>
        </div>

        {/* Быстрые действия */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateBalance(balance + 1000)}
            disabled={isUpdatingBalance}
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-1" />
            +1000 ₸
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateBalance(balance - 1000)}
            disabled={isUpdatingBalance}
            className="flex-1"
          >
            <Minus className="w-4 h-4 mr-1" />
            -1000 ₸
          </Button>
        </div>

        {/* История платежей */}
        {showHistory && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">История платежей</h4>
            {paymentHistory.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {paymentHistory.slice(0, 10).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.amount.toLocaleString()} ₸
                      </div>
                      <div className="text-xs text-gray-500">
                        {payment.description || 'Платеж'}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(payment.date).toLocaleDateString('ru-RU')}
                    </div>
                    <Badge variant={payment.type === 'prepayment' ? 'default' : 'secondary'} className="ml-2">
                      {payment.type === 'prepayment' ? 'Предоплата' : 'Платеж'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 text-sm">
                История платежей пуста
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
