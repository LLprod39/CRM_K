'use client'

import { useState, useEffect } from 'react'
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Download, 
  Upload,
  Database,
  Shield,
  Bell,
  Globe,
  Palette,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  Info,
  Trash2,
  Archive,
  FileText,
  Key,
  Mail,
  Phone,
  MapPin,
  Building
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SystemSettingsProps {
  className?: string
}

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
  }
  backup: {
    autoBackup: boolean
    backupFrequency: string
    retentionDays: number
  }
  appearance: {
    theme: string
    primaryColor: string
    sidebarCollapsed: boolean
  }
  contact: {
    companyName: string
    email: string
    phone: string
    address: string
  }
}

export default function SystemSettings({ className }: SystemSettingsProps) {
  const [config, setConfig] = useState<SystemConfig>({
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
      twoFactorAuth: false
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'daily',
      retentionDays: 30
    },
    appearance: {
      theme: 'light',
      primaryColor: 'blue',
      sidebarCollapsed: false
    },
    contact: {
      companyName: 'Центр развития детей',
      email: 'info@example.com',
      phone: '+7 (777) 123-45-67',
      address: 'г. Алматы, ул. Примерная, 123'
    }
  })

  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'security' | 'backup' | 'appearance' | 'contact'>('general')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const tabs = [
    { id: 'general', label: 'Общие', icon: Globe },
    { id: 'notifications', label: 'Уведомления', icon: Bell },
    { id: 'security', label: 'Безопасность', icon: Shield },
    { id: 'backup', label: 'Резервные копии', icon: Database },
    { id: 'appearance', label: 'Внешний вид', icon: Palette },
    { id: 'contact', label: 'Контакты', icon: Building }
  ]

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('idle')
    
    try {
      // Имитация сохранения настроек
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSaveStatus('success')
      
      // Сброс статуса через 3 секунды
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(config, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'system-settings.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target?.result as string)
        setConfig(importedConfig)
      } catch (error) {
        alert('Ошибка при импорте файла настроек')
      }
    }
    reader.readAsText(file)
  }

  const handleBackupDatabase = async () => {
    try {
      // Имитация создания резервной копии
      const response = await fetch('/api/admin/backup', { method: 'POST' })
      if (response.ok) {
        alert('Резервная копия создана успешно')
      } else {
        alert('Ошибка при создании резервной копии')
      }
    } catch (error) {
      alert('Ошибка при создании резервной копии')
    }
  }

  const handleClearCache = async () => {
    if (confirm('Вы уверены, что хотите очистить кэш системы?')) {
      try {
        // Имитация очистки кэша
        await new Promise(resolve => setTimeout(resolve, 1000))
        alert('Кэш очищен успешно')
      } catch (error) {
        alert('Ошибка при очистке кэша')
      }
    }
  }

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Название сайта
        </label>
        <input
          type="text"
          value={config.general.siteName}
          onChange={(e) => setConfig(prev => ({
            ...prev,
            general: { ...prev.general, siteName: e.target.value }
          }))}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Описание сайта
        </label>
        <textarea
          value={config.general.siteDescription}
          onChange={(e) => setConfig(prev => ({
            ...prev,
            general: { ...prev.general, siteDescription: e.target.value }
          }))}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Часовой пояс
          </label>
          <select
            value={config.general.timezone}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              general: { ...prev.general, timezone: e.target.value }
            }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Asia/Almaty">Алматы (UTC+6)</option>
            <option value="Asia/Aqtobe">Актобе (UTC+5)</option>
            <option value="Europe/Moscow">Москва (UTC+3)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Язык
          </label>
          <select
            value={config.general.language}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              general: { ...prev.general, language: e.target.value }
            }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ru">Русский</option>
            <option value="kk">Қазақша</option>
            <option value="en">English</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Валюта
          </label>
          <select
            value={config.general.currency}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              general: { ...prev.general, currency: e.target.value }
            }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="KZT">Тенге (₸)</option>
            <option value="USD">Доллар ($)</option>
            <option value="EUR">Евро (€)</option>
          </select>
        </div>
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center space-x-3">
            <Mail className="w-5 h-5 text-blue-600" />
            <div>
              <div className="font-medium text-gray-900">Email уведомления</div>
              <div className="text-sm text-gray-600">Отправка уведомлений на email</div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.notifications.emailNotifications}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                notifications: { ...prev.notifications, emailNotifications: e.target.checked }
              }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center space-x-3">
            <Phone className="w-5 h-5 text-green-600" />
            <div>
              <div className="font-medium text-gray-900">SMS уведомления</div>
              <div className="text-sm text-gray-600">Отправка SMS уведомлений</div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.notifications.smsNotifications}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                notifications: { ...prev.notifications, smsNotifications: e.target.checked }
              }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center space-x-3">
            <Bell className="w-5 h-5 text-purple-600" />
            <div>
              <div className="font-medium text-gray-900">Push уведомления</div>
              <div className="text-sm text-gray-600">Браузерные уведомления</div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.notifications.pushNotifications}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                notifications: { ...prev.notifications, pushNotifications: e.target.checked }
              }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Дней до напоминания о занятии
        </label>
        <input
          type="number"
          min="0"
          max="7"
          value={config.notifications.reminderDays}
          onChange={(e) => setConfig(prev => ({
            ...prev,
            notifications: { ...prev.notifications, reminderDays: parseInt(e.target.value) }
          }))}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  )

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Таймаут сессии (минуты)
        </label>
        <input
          type="number"
          min="5"
          max="480"
          value={config.security.sessionTimeout}
          onChange={(e) => setConfig(prev => ({
            ...prev,
            security: { ...prev.security, sessionTimeout: parseInt(e.target.value) }
          }))}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Минимальная длина пароля
        </label>
        <input
          type="number"
          min="6"
          max="32"
          value={config.security.passwordMinLength}
          onChange={(e) => setConfig(prev => ({
            ...prev,
            security: { ...prev.security, passwordMinLength: parseInt(e.target.value) }
          }))}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center space-x-3">
            <Key className="w-5 h-5 text-orange-600" />
            <div>
              <div className="font-medium text-gray-900">Строгие пароли</div>
              <div className="text-sm text-gray-600">Требовать сложные пароли</div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.security.requireStrongPasswords}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                security: { ...prev.security, requireStrongPasswords: e.target.checked }
              }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-red-600" />
            <div>
              <div className="font-medium text-gray-900">Двухфакторная аутентификация</div>
              <div className="text-sm text-gray-600">Дополнительная защита аккаунтов</div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.security.twoFactorAuth}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                security: { ...prev.security, twoFactorAuth: e.target.checked }
              }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  )

  const renderBackupSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center space-x-3">
            <Database className="w-5 h-5 text-blue-600" />
            <div>
              <div className="font-medium text-gray-900">Автоматическое резервное копирование</div>
              <div className="text-sm text-gray-600">Создавать резервные копии автоматически</div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.backup.autoBackup}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                backup: { ...prev.backup, autoBackup: e.target.checked }
              }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Частота резервного копирования
          </label>
          <select
            value={config.backup.backupFrequency}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              backup: { ...prev.backup, backupFrequency: e.target.value }
            }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="daily">Ежедневно</option>
            <option value="weekly">Еженедельно</option>
            <option value="monthly">Ежемесячно</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Дней хранения копий
          </label>
          <input
            type="number"
            min="1"
            max="365"
            value={config.backup.retentionDays}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              backup: { ...prev.backup, retentionDays: parseInt(e.target.value) }
            }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={handleBackupDatabase}
          className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Создать резервную копию</span>
        </button>

        <button
          onClick={handleClearCache}
          className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Очистить кэш</span>
        </button>
      </div>
    </div>
  )

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Тема оформления
        </label>
        <select
          value={config.appearance.theme}
          onChange={(e) => setConfig(prev => ({
            ...prev,
            appearance: { ...prev.appearance, theme: e.target.value }
          }))}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="light">Светлая</option>
          <option value="dark">Темная</option>
          <option value="auto">Автоматически</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Основной цвет
        </label>
        <div className="grid grid-cols-6 gap-3">
          {['blue', 'green', 'purple', 'red', 'yellow', 'indigo'].map(color => (
            <button
              key={color}
              onClick={() => setConfig(prev => ({
                ...prev,
                appearance: { ...prev.appearance, primaryColor: color }
              }))}
              className={cn(
                "w-12 h-12 rounded-xl border-2 transition-all",
                config.appearance.primaryColor === color
                  ? "border-gray-900 scale-110"
                  : "border-gray-300 hover:border-gray-400"
              )}
              style={{
                backgroundColor: color === 'blue' ? '#3B82F6' :
                                color === 'green' ? '#10B981' :
                                color === 'purple' ? '#8B5CF6' :
                                color === 'red' ? '#EF4444' :
                                color === 'yellow' ? '#F59E0B' :
                                color === 'indigo' ? '#6366F1' : '#3B82F6'
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center space-x-3">
          <Palette className="w-5 h-5 text-purple-600" />
          <div>
            <div className="font-medium text-gray-900">Свернутая боковая панель</div>
            <div className="text-sm text-gray-600">Сворачивать боковую панель по умолчанию</div>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.appearance.sidebarCollapsed}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              appearance: { ...prev.appearance, sidebarCollapsed: e.target.checked }
            }))}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  )

  const renderContactSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Название организации
        </label>
        <input
          type="text"
          value={config.contact.companyName}
          onChange={(e) => setConfig(prev => ({
            ...prev,
            contact: { ...prev.contact, companyName: e.target.value }
          }))}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={config.contact.email}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                contact: { ...prev.contact, email: e.target.value }
              }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Телефон
          </label>
          <div className="relative">
            <Phone className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="tel"
              value={config.contact.phone}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                contact: { ...prev.contact, phone: e.target.value }
              }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Адрес
        </label>
        <div className="relative">
          <MapPin className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
          <textarea
            value={config.contact.address}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              contact: { ...prev.contact, address: e.target.value }
            }))}
            rows={3}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  )

  return (
    <div className={cn("space-y-6 max-w-7xl mx-auto", className)}>
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Настройки системы</h2>
          <p className="text-gray-600 mt-1">Управление конфигурацией и параметрами системы</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportSettings}
            className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Экспорт
          </button>
          
          <label className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            Импорт
            <input
              type="file"
              accept=".json"
              onChange={handleImportSettings}
              className="hidden"
            />
          </label>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "px-6 py-2 text-white rounded-xl transition-colors flex items-center",
              saveStatus === 'success' && "bg-green-600",
              saveStatus === 'error' && "bg-red-600",
              saveStatus === 'idle' && "bg-blue-600 hover:bg-blue-700",
              isSaving && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : saveStatus === 'success' ? (
              <CheckCircle className="w-4 h-4 mr-2" />
            ) : saveStatus === 'error' ? (
              <AlertTriangle className="w-4 h-4 mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            <span>
              {isSaving ? 'Сохранение...' : 
               saveStatus === 'success' ? 'Сохранено' :
               saveStatus === 'error' ? 'Ошибка' : 'Сохранить'}
            </span>
          </button>
        </div>
      </div>

      {/* Вкладки */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'general' && renderGeneralSettings()}
          {activeTab === 'notifications' && renderNotificationSettings()}
          {activeTab === 'security' && renderSecuritySettings()}
          {activeTab === 'backup' && renderBackupSettings()}
          {activeTab === 'appearance' && renderAppearanceSettings()}
          {activeTab === 'contact' && renderContactSettings()}
        </div>
      </div>
    </div>
  )
}
