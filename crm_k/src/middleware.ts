import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Публичные маршруты
  const publicRoutes = ['/login']
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Публичные API эндпоинты
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  // Для остальных маршрутов проверка аутентификации происходит на клиенте
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
