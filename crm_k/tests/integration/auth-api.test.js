const { TestHelpers } = require('../utils/testHelpers')
const { createTestUser } = require('../fixtures/testData')

describe('Authentication API', () => {
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
  })

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'user@test.com',
        password: 'user123'
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
      expect(data.user.role).toBe('USER')
    })

    it('should reject invalid credentials', async () => {
      const loginData = {
        email: 'user@test.com',
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
      const token = testHelpers.createToken(testData.user)
      
      const response = await fetch('http://localhost:3000/api/students', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      expect(response.status).toBe(200)
    })

    it('should reject requests without token', async () => {
      const response = await fetch('http://localhost:3000/api/students', {
        headers: {
          'Content-Type': 'application/json',
        }
      })

      expect(response.status).toBe(401)
    })

    it('should reject requests with invalid token', async () => {
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
          userId: testData.user.id,
          email: testData.user.email,
          name: testData.user.name,
          role: testData.user.role
        },
        'test-secret-key',
        { expiresIn: '-1h' }
      )

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
