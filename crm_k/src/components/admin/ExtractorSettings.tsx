"use client"

import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Eye, EyeOff, RefreshCw, Save } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { cn } from '@/lib/utils'

type ExtractorSettingsState = {
  extractorModel: string
  autoCommit: boolean
  autoCommitMinConf: number
  fieldMinConf: number
  patchMaxAgeSec: number
  schemaVersion: string
  upsertDedupeWindowSec: number
  auditLogLevel: string
  lessonBookingMinConf: number
  studentRegistrationMinConf: number
  consultationMinConf: number
  googleGenaiApiKey: string
}

const DEFAULT_STATE: ExtractorSettingsState = {
  extractorModel: 'gemini-1.5-pro',
  autoCommit: false,
  autoCommitMinConf: 0.85,
  fieldMinConf: 0.75,
  patchMaxAgeSec: 3600,
  schemaVersion: '1.0',
  upsertDedupeWindowSec: 300,
  auditLogLevel: 'info',
  lessonBookingMinConf: 0.8,
  studentRegistrationMinConf: 0.9,
  consultationMinConf: 0.7,
  googleGenaiApiKey: '',
}

interface FetchResponse extends Partial<ExtractorSettingsState> {
  updatedAt?: string
}

export default function ExtractorSettings({ className }: { className?: string }) {
  const [state, setState] = useState<ExtractorSettingsState>(DEFAULT_STATE)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [showApiKey, setShowApiKey] = useState(false)

  const loadSettings = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiRequest('/api/admin/extractor-settings')
      if (!response.ok) {
        throw new Error('Failed to load extractor settings')
      }

      const data = (await response.json()) as FetchResponse
      setState((current) => ({
        ...current,
        ...data,
        googleGenaiApiKey: data.googleGenaiApiKey ?? '',
      }))
    } catch (err) {
      console.error('Extractor settings load error', err)
      setError('Failed to load extractor settings')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadSettings()
  }, [])

  const handleChange = <K extends keyof ExtractorSettingsState>(key: K, value: ExtractorSettingsState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }))
  }

  const handleNumberChange = (key: keyof ExtractorSettingsState) => (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value

    if (raw === '') {
      handleChange(key, 0 as ExtractorSettingsState[typeof key])
      return
    }

    const numeric = Number(raw)

    if (Number.isFinite(numeric)) {
      handleChange(key, numeric as ExtractorSettingsState[typeof key])
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setIsSaving(true)
    setSaveStatus('idle')
    setError(null)

    try {
      const payload = {
        ...state,
        googleGenaiApiKey: state.googleGenaiApiKey.trim() ? state.googleGenaiApiKey.trim() : null,
      }

      const response = await apiRequest('/api/admin/extractor-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        const message = data?.error || 'Failed to save extractor settings'
        throw new Error(message)
      }

      const updated = (await response.json()) as FetchResponse
      setState((current) => ({
        ...current,
        ...updated,
        googleGenaiApiKey: updated.googleGenaiApiKey ?? '',
      }))
      setSaveStatus('success')
    } catch (err) {
      console.error('Extractor settings save error', err)
      setError(err instanceof Error ? err.message : 'Failed to save extractor settings')
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white p-6 shadow-sm', className)}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Extractor settings</h2>
          <p className="text-sm text-gray-500">
            Configure Auto-commit thresholds, per-form confidence gates, and LLM integration for WhatsApp.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadSettings()}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section>
          <h3 className="mb-4 text-base font-semibold">LLM integration</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Model</label>
              <input
                type="text"
                value={state.extractorModel}
                onChange={(event) => handleChange('extractorModel', event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="gemini-1.5-pro"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Google GenAI API key</label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={state.googleGenaiApiKey}
                  onChange={(event) => handleChange('googleGenaiApiKey', event.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Leave empty to disable direct calls"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-base font-semibold">Commit policy</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
              <input
                type="checkbox"
                checked={state.autoCommit}
                onChange={(event) => handleChange('autoCommit', event.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm text-gray-700">Auto-commit when thresholds met</span>
            </label>
            <NumberInput
              label="Minimum draft confidence"
              value={state.autoCommitMinConf}
              step={0.01}
              min={0}
              max={1}
              onChange={handleNumberChange('autoCommitMinConf')}
            />
            <NumberInput
              label="Minimum field confidence"
              value={state.fieldMinConf}
              step={0.01}
              min={0}
              max={1}
              onChange={handleNumberChange('fieldMinConf')}
            />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <NumberInput
              label="Lesson booking threshold"
              value={state.lessonBookingMinConf}
              step={0.01}
              min={0}
              max={1}
              onChange={handleNumberChange('lessonBookingMinConf')}
            />
            <NumberInput
              label="Student registration threshold"
              value={state.studentRegistrationMinConf}
              step={0.01}
              min={0}
              max={1}
              onChange={handleNumberChange('studentRegistrationMinConf')}
            />
            <NumberInput
              label="Consultation threshold"
              value={state.consultationMinConf}
              step={0.01}
              min={0}
              max={1}
              onChange={handleNumberChange('consultationMinConf')}
            />
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-base font-semibold">Runtime options</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <NumberInput
              label="Patch max age (sec)"
              value={state.patchMaxAgeSec}
              min={0}
              step={60}
              onChange={handleNumberChange('patchMaxAgeSec')}
            />
            <NumberInput
              label="Upsert dedupe window (sec)"
              value={state.upsertDedupeWindowSec}
              min={0}
              step={30}
              onChange={handleNumberChange('upsertDedupeWindowSec')}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Schema version</label>
              <input
                type="text"
                value={state.schemaVersion}
                onChange={(event) => handleChange('schemaVersion', event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Audit log level</label>
              <select
                value={state.auditLogLevel}
                onChange={(event) => handleChange('auditLogLevel', event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="silent">silent</option>
                <option value="error">error</option>
                <option value="warn">warn</option>
                <option value="info">info</option>
                <option value="debug">debug</option>
              </select>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="text-sm text-gray-500">
            {isLoading
              ? 'Loading...'
              : saveStatus === 'success'
              ? 'Settings saved'
              : saveStatus === 'error'
              ? 'Error while saving'
              : 'Changes apply immediately after saving.'}
          </div>
          <button
            type="submit"
            disabled={isSaving || isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <Save className={cn('h-4 w-4', { 'animate-spin': isSaving })} />
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

interface NumberInputProps {
  label: string
  value: number
  step?: number
  min?: number
  max?: number
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}

function NumberInput({ label, value, step = 0.01, min, max, onChange }: NumberInputProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={onChange}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
    </div>
  )
}

