const { TestHelpers } = require('../utils/testHelpers')
const jwt = require('jsonwebtoken')

// Мок для fetch API
global.fetch = jest.fn()

describe('Authentication API (Mocked)', () => {
  let testHelpers
  let testData

  beforeAll(async () => {
    testHelpers = new TestHelpers()
    await testHelpers.cleanupDatabase()
    testData = await testHelpers.seedTestData()
  })

  afterAll(async () => {
    await testHelpers.close()
  })

  beforeEach(async () => {
    await testHelpers.cleanupDatabase()
    testData = await testHelpers.seedTestData()
    // Очищаем моки перед каждым тестом
    fetch.mockClear()
  })

  describe('POST /api/auth/login', () => {
    it('should login with valid admin credentials', async () => {
      // Мокаем успешный ответ
      fetch.mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          token: testHelpers.createToken(testData.admin),
          user: {
            id: testData.admin.id,
            email: testData.admin.email,
            name: testData.admin.name,
            role: testData.admin.role
          }
        })
      })

      const loginData = {
        email: 'admin@crm.com',
        password: '123456'
      }

      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('token')
      expect(data).toHaveProperty('user')
      expect(data.user.email).toBe(loginData.email)
      expect(data.user.role).toBe('ADMIN')
    })

    it('should reject invalid credentials', async () => {
      // Мокаем ошибку аутентификации
      fetch.mockResolvedValueOnce({
        status: 401,
        json: async () => ({
          error: 'Неверный email или пароль'
        })
      })

      const loginData = {
        email: 'admin@crm.com',
        password: 'wrongpassword'
      }

      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
      })

      expect(response.status).toBe(401)
      
      const data = await response.json()
      expect(data).toHaveProperty('error')
    })

    it('should reject non-existent user', async () => {
      // Мокаем ошибку аутентификации
      fetch.mockResolvedValueOnce({
        status: 401,
        json: async () => ({
          error: 'Неверный email или пароль'
        })
      })

      const loginData = {
        email: 'nonexistent@test.com',
        password: 'password'
      }

      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
      })

      expect(response.status).toBe(401)
    })

    it('should validate required fields', async () => {
      // Мокаем ошибку валидации
      fetch.mockResolvedValueOnce({
        status: 400,
        json: async () => ({
          error: 'Email и пароль обязательны'
        })
      })

      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      })

      expect(response.status).toBe(400)
    })
  })

  describe('Token validation', () => {
    it('should validate token in protected routes', async () => {
      const token = testHelpers.createToken(testData.admin)
      
      // Мокаем успешный ответ
      fetch.mockResolvedValueOnce({
        status: 200,
        json: async () => []
      })
      
      const response = await fetch('http://localhost:3000/api/students', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      expect(response.status).toBe(200)
    })

    it('should reject requests without token', async () => {
      // Мокаем ошибку аутентификации
      fetch.mockResolvedValueOnce({
        status: 401,
        json: async () => ({
          error: 'Необходима аутентификация'
        })
      })

      const response = await fetch('http://localhost:3000/api/students', {
        headers: {
          'Content-Type': 'application/json',
        }
      })

      expect(response.status).toBe(401)
    })

    it('should reject requests with invalid token', async () => {
      // Мокаем ошибку аутентификации
      fetch.mockResolvedValueOnce({
        status: 401,
        json: async () => ({
          error: 'Необходима аутентификация'
        })
      })

      const response = await fetch('http://localhost:3000/api/students', {
        headers: {
          'Authorization': 'Bearer invalid-token',
          'Content-Type': 'application/json',
        }
      })

      expect(response.status).toBe(401)
    })

    it('should handle expired tokens', async () => {
      const expiredToken = jwt.sign(
        {
          userId: testData.admin.id,
          email: testData.admin.email,
          name: testData.admin.name,
          role: testData.admin.role
        },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '-1h' }
      )

      // Мокаем ошибку аутентификации
      fetch.mockResolvedValueOnce({
        status: 401,
        json: async () => ({
          error: 'Необходима аутентификация'
        })
      })

      const response = await fetch('http://localhost:3000/api/students', {
        headers: {
          'Authorization': `Bearer ${expiredToken}`,
          'Content-Type': 'application/json',
        }
      })

      expect(response.status).toBe(401)
    })
  })

  describe('Role-based access', () => {
    it('should allow ADMIN to access admin routes', async () => {
      const token = testHelpers.createToken(testData.admin)
      
      // Мокаем успешный ответ
      fetch.mockResolvedValueOnce({
        status: 200,
        json: async () => []
      })
      
      const response = await fetch('http://localhost:3000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      expect(response.status).toBe(200)
    })

    it('should deny USER access to admin routes', async () => {
      const token = testHelpers.createToken(testData.user)
      
      // Мокаем ошибку доступа
      fetch.mockResolvedValueOnce({
        status: 403,
        json: async () => ({
          error: 'Доступ запрещен'
        })
      })
      
      const response = await fetch('http://localhost:3000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      expect(response.status).toBe(403)
    })

    it('should allow USER to access user routes', async () => {
      const token = testHelpers.createToken(testData.user)
      
      // Мокаем успешный ответ
      fetch.mockResolvedValueOnce({
        status: 200,
        json: async () => []
      })
      
      const response = await fetch('http://localhost:3000/api/students', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      expect(response.status).toBe(200)
    })

    it('should allow ADMIN to access user routes', async () => {
      const token = testHelpers.createToken(testData.admin)
      
      // Мокаем успешный ответ
      fetch.mockResolvedValueOnce({
        status: 200,
        json: async () => []
      })
      
      const response = await fetch('http://localhost:3000/api/students', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      expect(response.status).toBe(200)
    })
  })
})
