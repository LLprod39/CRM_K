const { verifyToken } = require('../../src/lib/auth')
const jwt = require('jsonwebtoken')

describe('Authentication', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key'
  
  describe('verifyToken', () => {
    it('should verify valid token and return user data', () => {
      const userData = {
        userId: 1,
        email: 'admin@crm.com',
        name: 'Admin CRM',
        role: 'ADMIN'
      }
      
      const token = jwt.sign(userData, JWT_SECRET)
      const result = verifyToken(token)
      
      expect(result).toEqual({
        id: userData.userId,
        email: userData.email,
        name: userData.name,
        role: userData.role
      })
    })

    it('should return null for invalid token', () => {
      const result = verifyToken('invalid-token')
      expect(result).toBeNull()
    })

    it('should return null for expired token', () => {
      const userData = {
        userId: 1,
        email: 'admin@crm.com',
        name: 'Admin CRM',
        role: 'ADMIN'
      }
      
      const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '-1h' })
      const result = verifyToken(token)
      
      expect(result).toBeNull()
    })

    it('should handle token with missing fields', () => {
      const userData = {
        userId: 1,
        email: 'admin@crm.com',
        role: 'ADMIN'
        // missing name field
      }
      
      const token = jwt.sign(userData, JWT_SECRET)
      const result = verifyToken(token)
      
      expect(result).toEqual({
        id: userData.userId,
        email: userData.email,
        name: '', // should default to empty string
        role: userData.role
      })
    })

    it('should handle ADMIN role', () => {
      const userData = {
        userId: 1,
        email: 'admin@crm.com',
        name: 'Admin CRM',
        role: 'ADMIN'
      }
      
      const token = jwt.sign(userData, JWT_SECRET)
      const result = verifyToken(token)
      
      expect(result.role).toBe('ADMIN')
    })

    it('should handle USER role', () => {
      const userData = {
        userId: 2,
        email: 'user@test.com',
        name: 'Test User',
        role: 'USER'
      }
      
      const token = jwt.sign(userData, JWT_SECRET)
      const result = verifyToken(token)
      
      expect(result.role).toBe('USER')
    })
  })

})
