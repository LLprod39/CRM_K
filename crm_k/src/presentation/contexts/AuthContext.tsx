'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { AuthContextType, AuthUser, LoginData } from '../../domain/entities/User'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Проверяем, есть ли сохраненный пользователь в localStorage
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        console.log('🔍 Загруженный пользователь из localStorage:', parsedUser)
        
        // Проверяем структуру данных
        if (parsedUser.user) {
          // Если данные в формате { user: { ... } }, берем только user
          setUser(parsedUser.user)
        } else {
          // Если данные уже в правильном формате
          setUser(parsedUser)
        }
      } catch (error) {
        console.error('Ошибка при загрузке пользователя:', error)
        localStorage.removeItem('user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (data: LoginData): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const userData = await response.json()
        console.log('🔍 Данные от API:', userData)
        
        // API возвращает { token, user: { ... } }, но нам нужен только user
        const actualUser = userData.user || userData
        console.log('🔍 Фактические данные пользователя:', actualUser)
        
        setUser(actualUser)
        localStorage.setItem('user', JSON.stringify(actualUser))
        localStorage.setItem('token', userData.token)
        return true
      } else {
        const errorData = await response.json()
        console.error('Ошибка входа:', errorData.error)
        return false
      }
    } catch (error) {
      console.error('Ошибка входа:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth должен использоваться внутри AuthProvider')
  }
  return context
}
