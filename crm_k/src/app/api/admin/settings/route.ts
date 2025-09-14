import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'

interface SystemConfig {
  general: {
    siteName: string
    siteDescription: string
    timezone: string
    language: string
    currency: string
  }
  notifications: {
    emailNotifications: boolean
    smsNotifications: boolean
    pushNotifications: boolean
    reminderDays: number
  }
  security: {
    sessionTimeout: number
    passwordMinLength: number
    requireStrongPasswords: boolean
    twoFactorAuth: boolean
    ipWhitelist: string[]
    maxLoginAttempts: number
    lockoutDuration: number
  }
  backup: {
    autoBackup: boolean
    backupFrequency: string
    retentionDays: number
    backupLocation: string
  }
  appearance: {
    theme: string
    primaryColor: string
    sidebarCollapsed: boolean
    logoUrl: string
    faviconUrl: string
    customCss: string
  }
  contact: {
    companyName: string
    email: string
    phone: string
    address: string
    website: string
    socialMedia: {
      facebook: string
      instagram: string
      telegram: string
      whatsapp: string
    }
  }
}

// Временное хранилище настроек (в реальном проекте используйте базу данных)
let systemConfig: SystemConfig = {
  general: {
    siteName: 'CRM_K - Система управления',
    siteDescription: 'Система управления занятиями и учениками',
    timezone: 'Asia/Almaty',
    language: 'ru',
    currency: 'KZT'
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    reminderDays: 1
  },
  security: {
    sessionTimeout: 30,
    passwordMinLength: 8,
    requireStrongPasswords: true,
    twoFactorAuth: false,
    ipWhitelist: [],
    maxLoginAttempts: 5,
    lockoutDuration: 15
  },
  backup: {
    autoBackup: true,
    backupFrequency: 'daily',
    retentionDays: 30,
    backupLocation: '/backups'
  },
  appearance: {
    theme: 'light',
    primaryColor: 'blue',
    sidebarCollapsed: false,
    logoUrl: '',
    faviconUrl: '',
    customCss: ''
  },
  contact: {
    companyName: 'Центр развития детей',
    email: 'info@example.com',
    phone: '+7 (777) 123-45-67',
    address: 'г. Алматы, ул. Примерная, 123',
    website: 'https://example.com',
    socialMedia: {
      facebook: '',
      instagram: '',
      telegram: '',
      whatsapp: ''
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    return NextResponse.json(systemConfig)
  } catch (error) {
    console.error('Ошибка получения настроек:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const newConfig = await request.json()
    
    // Валидация конфигурации
    if (!validateConfig(newConfig)) {
      return NextResponse.json({ error: 'Некорректная конфигурация' }, { status: 400 })
    }

    // Обновление конфигурации
    systemConfig = { ...systemConfig, ...newConfig }
    
    // Логирование изменений
    console.log(`Настройки системы обновлены пользователем: ${user.email}`)
    
    return NextResponse.json({ 
      message: 'Настройки успешно сохранены',
      config: systemConfig 
    })
  } catch (error) {
    console.error('Ошибка сохранения настроек:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

function validateConfig(config: unknown): boolean {
  // Базовая валидация структуры конфигурации
  const requiredSections = ['general', 'notifications', 'security', 'backup', 'appearance', 'contact']
  
  if (typeof config !== 'object' || config === null) {
    return false
  }
  
  const configObj = config as Record<string, unknown>
  
  for (const section of requiredSections) {
    if (!configObj[section] || typeof configObj[section] !== 'object') {
      return false
    }
  }

  // Валидация безопасности
  const security = configObj.security as Record<string, unknown>
  if (security) {
    if (typeof security.sessionTimeout !== 'number' || security.sessionTimeout < 5 || security.sessionTimeout > 480) {
      return false
    }
    if (typeof security.passwordMinLength !== 'number' || security.passwordMinLength < 6 || security.passwordMinLength > 32) {
      return false
    }
  }

  return true
}
