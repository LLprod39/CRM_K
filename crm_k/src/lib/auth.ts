import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { AuthUser } from '@/types'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      email: string;
      name?: string;
      role: string;
    }
    return {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name || '',
      role: decoded.role as 'ADMIN' | 'USER'
    }
  } catch (error) {
    console.error('Ошибка верификации токена:', error);
    return null
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

export function getAuthUser(request: NextRequest): AuthUser | null {
  const token = getTokenFromRequest(request)
  if (!token) return null
  return verifyToken(token)
}
