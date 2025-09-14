// Jest setup file
import '@testing-library/jest-dom'

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key'
process.env.DATABASE_URL = 'file:./test.db'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Global test utilities
global.testUtils = {
  createMockUser: (overrides = {}) => ({
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
    ...overrides,
  }),
  
  createMockStudent: (overrides = {}) => ({
    id: 1,
    fullName: 'Test Student',
    phone: '+7 (999) 999-99-99',
    age: 5,
    parentName: 'Test Parent',
    diagnosis: 'Test Diagnosis',
    comment: 'Test Comment',
    photoUrl: null,
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  createMockLesson: (overrides = {}) => ({
    id: 1,
    date: new Date('2025-01-01T10:00:00Z'),
    endTime: new Date('2025-01-01T11:00:00Z'),
    studentId: 1,
    cost: 1000,
    isCompleted: false,
    isPaid: false,
    isCancelled: false,
    notes: 'Test lesson',
    comment: null,
    lessonType: 'individual',
    location: 'office',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  createMockPayment: (overrides = {}) => ({
    id: 1,
    studentId: 1,
    amount: 1000,
    date: new Date(),
    description: 'Test payment',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
}

// Suppress console warnings in tests
const originalWarn = console.warn
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning: ReactDOM.render is no longer supported')
  ) {
    return
  }
  originalWarn.call(console, ...args)
}
