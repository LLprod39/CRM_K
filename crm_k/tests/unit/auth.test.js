const { verifyToken } = require('../../src/lib/auth')
const jwt = require('jsonwebtoken')

describe('Authentication', () => {
  const JWT_SECRET = 'test-secret-key'
  
  describe('verifyToken', () => {
    it('should verify valid token and return user data', () => {
      const userData = {
        userId: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER'
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
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER'
      }
      
      const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '-1h' })
      const result = verifyToken(token)
      
      expect(result).toBeNull()
    })

    it('should handle token with missing fields', () => {
      const userData = {
        userId: 1,
        email: 'test@example.com',
        role: 'USER'
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
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN'
      }
      
      const token = jwt.sign(userData, JWT_SECRET)
      const result = verifyToken(token)
      
      expect(result.role).toBe('ADMIN')
    })
  })

})
