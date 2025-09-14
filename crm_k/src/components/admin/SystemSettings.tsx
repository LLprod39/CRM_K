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
  Building,
  Eye,
  EyeOff,
  Plus,
  X,
  ExternalLink,
  Image,
  Monitor,
  Smartphone,
  Tablet,
  Wifi,
  WifiOff,
  Lock,
  Unlock,
  Calendar,
  HardDrive,
  Cloud,
  CloudOff
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiRequest } from '@/lib/api'

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

interface BackupInfo {
  id: string
  filename: string
  size: number
  createdAt: Date
  type: 'manual' | 'automatic'
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
  })

  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'security' | 'backup' | 'appearance' | 'contact'>('general')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [isLoadingBackups, setIsLoadingBackups] = useState(false)
  const [newIpAddress, setNewIpAddress] = useState('')
  const [showCustomCss, setShowCustomCss] = useState(false)

  const tabs = [
    { id: 'general', label: 'Общие', icon: Globe },
    { id: 'notifications', label: 'Уведомления', icon: Bell },
    { id: 'security', label: 'Безопасность', icon: Shield },
    { id: 'backup', label: 'Резервные копии', icon: Database },
    { id: 'appearance', label: 'Внешний вид', icon: Palette },
    { id: 'contact', label: 'Контакты', icon: Building }
  ]

  // Загрузка настроек при монтировании компонента
  useEffect(() => {
    loadSettings()
    loadBackups()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await apiRequest('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error)
    }
  }

  const loadBackups = async () => {
    setIsLoadingBackups(true)
    try {
      const response = await apiRequest('/api/admin/backup')
      if (response.ok) {
        const data = await response.json()
        setBackups(data.backups || [])
      }
    } catch (error) {
      console.error('Ошибка загрузки резервных копий:', error)
    } finally {
      setIsLoadingBackups(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('idle')
    
    try {
      const response = await apiRequest('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify(config)
      })
      
      if (response.ok) {
        setSaveStatus('success')
        // Сброс статуса через 3 секунды
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error)
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
      const response = await apiRequest('/api/admin/backup', {
        method: 'POST',
        body: JSON.stringify({ type: 'manual' })
      })
      
      if (response.ok) {
        const data = await response.json()
        alert('Резервная копия создана успешно')
        loadBackups() // Обновляем список резервных копий
      } else {
        alert('Ошибка при создании резервной копии')
      }
    } catch (error) {
      console.error('Ошибка создания резервной копии:', error)
      alert('Ошибка при создании резервной копии')
    }
  }

  const handleDownloadBackup = async (backupId: string) => {
    try {
      const response = await apiRequest(`/api/admin/backup/${backupId}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `backup_${backupId}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Ошибка при скачивании резервной копии')
      }
    } catch (error) {
      console.error('Ошибка скачивания резервной копии:', error)
      alert('Ошибка при скачивании резервной копии')
    }
  }

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту резервную копию?')) return

    try {
      const response = await apiRequest(`/api/admin/backup?id=${backupId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        alert('Резервная копия удалена успешно')
        loadBackups() // Обновляем список резервных копий
      } else {
        alert('Ошибка при удалении резервной копии')
      }
    } catch (error) {
      console.error('Ошибка удаления резервной копии:', error)
      alert('Ошибка при удалении резервной копии')
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

  const handleAddIpAddress = () => {
    if (newIpAddress.trim() && !config.security.ipWhitelist.includes(newIpAddress.trim())) {
      setConfig(prev => ({
        ...prev,
        security: {
          ...prev.security,
          ipWhitelist: [...prev.security.ipWhitelist, newIpAddress.trim()]
        }
      }))
      setNewIpAddress('')
    }
  }

  const handleRemoveIpAddress = (ip: string) => {
    setConfig(prev => ({
      ...prev,
      security: {
        ...prev.security,
        ipWhitelist: prev.security.ipWhitelist.filter(addr => addr !== ip)
      }
    }))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Максимум попыток входа
          </label>
          <input
            type="number"
            min="3"
            max="10"
            value={config.security.maxLoginAttempts}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              security: { ...prev.security, maxLoginAttempts: parseInt(e.target.value) }
            }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Блокировка на (минуты)
          </label>
          <input
            type="number"
            min="5"
            max="60"
            value={config.security.lockoutDuration}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              security: { ...prev.security, lockoutDuration: parseInt(e.target.value) }
            }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
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

      {/* IP Whitelist */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Белый список IP-адресов
        </label>
        <div className="space-y-3">
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="192.168.1.1"
              value={newIpAddress}
              onChange={(e) => setNewIpAddress(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleAddIpAddress}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {config.security.ipWhitelist.length > 0 && (
            <div className="space-y-2">
              {config.security.ipWhitelist.map((ip, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Wifi className="w-4 h-4 text-green-600" />
                    <span className="font-mono text-sm">{ip}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveIpAddress(ip)}
                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Расположение копий
          </label>
          <input
            type="text"
            value={config.backup.backupLocation}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              backup: { ...prev.backup, backupLocation: e.target.value }
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

      {/* Список резервных копий */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Резервные копии</h3>
          <button
            onClick={loadBackups}
            disabled={isLoadingBackups}
            className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingBackups ? 'animate-spin' : ''}`} />
            <span>Обновить</span>
          </button>
        </div>

        {isLoadingBackups ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">Загрузка резервных копий...</p>
          </div>
        ) : backups.length > 0 ? (
          <div className="space-y-3">
            {backups.map((backup) => (
              <div key={backup.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Archive className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{backup.filename}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(backup.createdAt).toLocaleString('ru-RU')} • {formatFileSize(backup.size)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    backup.type === 'manual' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {backup.type === 'manual' ? 'Ручная' : 'Автоматическая'}
                  </span>
                  <button
                    onClick={() => handleDownloadBackup(backup.id)}
                    className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                    title="Скачать"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteBackup(backup.id)}
                    className="p-2 text-red-600 hover:text-red-800 transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Archive className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Резервные копии не найдены</p>
            <p className="text-sm text-gray-400">Создайте первую резервную копию</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="grid grid-cols-6 gap-2">
            {['blue', 'green', 'purple', 'red', 'yellow', 'indigo'].map(color => (
              <button
                key={color}
                onClick={() => setConfig(prev => ({
                  ...prev,
                  appearance: { ...prev.appearance, primaryColor: color }
                }))}
                className={cn(
                  "w-8 h-8 rounded-lg border-2 transition-all",
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL логотипа
          </label>
          <div className="relative">
            <Image className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="url"
              placeholder="https://example.com/logo.png"
              value={config.appearance.logoUrl}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                appearance: { ...prev.appearance, logoUrl: e.target.value }
              }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL favicon
          </label>
          <div className="relative">
            <Image className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="url"
              placeholder="https://example.com/favicon.ico"
              value={config.appearance.faviconUrl}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                appearance: { ...prev.appearance, faviconUrl: e.target.value }
              }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Пользовательские стили CSS
          </label>
          <button
            onClick={() => setShowCustomCss(!showCustomCss)}
            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
          >
            {showCustomCss ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showCustomCss ? 'Скрыть' : 'Показать'}</span>
          </button>
        </div>
        {showCustomCss && (
          <textarea
            placeholder="/* Ваши пользовательские стили */"
            value={config.appearance.customCss}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              appearance: { ...prev.appearance, customCss: e.target.value }
            }))}
            rows={8}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
        )}
      </div>

      <div className="space-y-4">
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

      {/* Предварительный просмотр */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Предварительный просмотр</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-xl">
            <div className="flex items-center space-x-2 mb-2">
              <Monitor className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">Десктоп</span>
            </div>
            <div className="w-full h-20 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-xs text-gray-500">Предварительный просмотр</span>
            </div>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-xl">
            <div className="flex items-center space-x-2 mb-2">
              <Tablet className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">Планшет</span>
            </div>
            <div className="w-full h-20 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-xs text-gray-500">Предварительный просмотр</span>
            </div>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-xl">
            <div className="flex items-center space-x-2 mb-2">
              <Smartphone className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">Мобильный</span>
            </div>
            <div className="w-full h-20 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-xs text-gray-500">Предварительный просмотр</span>
            </div>
          </div>
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Веб-сайт
          </label>
          <div className="relative">
            <ExternalLink className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="url"
              placeholder="https://example.com"
              value={config.contact.website}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                contact: { ...prev.contact, website: e.target.value }
              }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Адрес
          </label>
          <div className="relative">
            <MapPin className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={config.contact.address}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                contact: { ...prev.contact, address: e.target.value }
              }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Социальные сети */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Социальные сети</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Facebook
            </label>
            <div className="relative">
              <ExternalLink className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="url"
                placeholder="https://facebook.com/yourpage"
                value={config.contact.socialMedia.facebook}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  contact: { 
                    ...prev.contact, 
                    socialMedia: { ...prev.contact.socialMedia, facebook: e.target.value }
                  }
                }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instagram
            </label>
            <div className="relative">
              <ExternalLink className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="url"
                placeholder="https://instagram.com/yourpage"
                value={config.contact.socialMedia.instagram}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  contact: { 
                    ...prev.contact, 
                    socialMedia: { ...prev.contact.socialMedia, instagram: e.target.value }
                  }
                }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telegram
            </label>
            <div className="relative">
              <ExternalLink className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="url"
                placeholder="https://t.me/yourchannel"
                value={config.contact.socialMedia.telegram}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  contact: { 
                    ...prev.contact, 
                    socialMedia: { ...prev.contact.socialMedia, telegram: e.target.value }
                  }
                }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp
            </label>
            <div className="relative">
              <ExternalLink className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="url"
                placeholder="https://wa.me/77771234567"
                value={config.contact.socialMedia.whatsapp}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  contact: { 
                    ...prev.contact, 
                    socialMedia: { ...prev.contact.socialMedia, whatsapp: e.target.value }
                  }
                }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Предварительный просмотр контактов */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Предварительный просмотр</h3>
        <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">{config.contact.companyName}</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>{config.contact.email}</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>{config.contact.phone}</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>{config.contact.address}</span>
              </div>
              {config.contact.website && (
                <div className="flex items-center justify-center space-x-2">
                  <ExternalLink className="w-4 h-4" />
                  <a href={config.contact.website} className="text-blue-600 hover:text-blue-800">
                    {config.contact.website}
                  </a>
                </div>
              )}
            </div>
          </div>
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
                onClick={() => setActiveTab(tab.id as 'general' | 'notifications' | 'security' | 'backup' | 'appearance' | 'contact')}
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
