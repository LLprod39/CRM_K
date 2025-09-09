import { AuthUser } from '@/types'

export function getAuthHeaders() {
  const token = localStorage.getItem('token')
  if (!token) {
    return {}
  }

  return {
    'Authorization': `Bearer ${token}`,
  }
}

export async function apiRequest(url: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  return response
}
