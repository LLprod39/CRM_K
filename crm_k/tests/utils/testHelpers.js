const { PrismaClient } = require('@prisma/client')
const jwt = require('jsonwebtoken')

// Test database client
const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.db'
    }
  }
})

// Test utilities
class TestHelpers {
  constructor() {
    this.prisma = testPrisma
    this.jwtSecret = 'test-secret-key'
  }

  // Database helpers
  async cleanupDatabase() {
    const tablenames = await this.prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_prisma_migrations';
    `
    
    for (const { name } of tablenames) {
      await this.prisma.$executeRawUnsafe(`DELETE FROM "${name}";`)
    }
  }

  async seedTestData() {
    // Create test admin user
    const admin = await this.prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: '$2b$12$test.hash.for.admin',
        name: 'Test Admin',
        role: 'ADMIN'
      }
    })

    // Create test user
    const user = await this.prisma.user.create({
      data: {
        email: 'user@test.com',
        password: '$2b$12$test.hash.for.user',
        name: 'Test User',
        role: 'USER'
      }
    })

    // Create test student
    const student = await this.prisma.student.create({
      data: {
        fullName: 'Test Student',
        phone: '+7 (999) 999-99-99',
        age: 5,
        parentName: 'Test Parent',
        diagnosis: 'Test Diagnosis',
        comment: 'Test Comment',
        userId: user.id
      }
    })

    return { admin, user, student }
  }

  // Authentication helpers
  createToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      this.jwtSecret
    )
  }

  verifyToken(token) {
    return jwt.verify(token, this.jwtSecret)
  }

  // API request helpers
  createAuthHeaders(user) {
    const token = this.createToken(user)
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  // Date helpers
  createDateString(date) {
    return date.toISOString().split('T')[0]
  }

  createDateTimeString(date) {
    return date.toISOString()
  }

  // Assertion helpers
  expectValidUser(user) {
    expect(user).toHaveProperty('id')
    expect(user).toHaveProperty('email')
    expect(user).toHaveProperty('name')
    expect(user).toHaveProperty('role')
    expect(['ADMIN', 'USER']).toContain(user.role)
  }

  expectValidStudent(student) {
    expect(student).toHaveProperty('id')
    expect(student).toHaveProperty('fullName')
    expect(student).toHaveProperty('phone')
    expect(student).toHaveProperty('age')
    expect(student).toHaveProperty('parentName')
    expect(student).toHaveProperty('userId')
  }

  expectValidLesson(lesson) {
    expect(lesson).toHaveProperty('id')
    expect(lesson).toHaveProperty('date')
    expect(lesson).toHaveProperty('endTime')
    expect(lesson).toHaveProperty('studentId')
    expect(lesson).toHaveProperty('cost')
    expect(lesson).toHaveProperty('isCompleted')
    expect(lesson).toHaveProperty('isPaid')
    expect(lesson).toHaveProperty('isCancelled')
  }

  expectValidPayment(payment) {
    expect(payment).toHaveProperty('id')
    expect(payment).toHaveProperty('studentId')
    expect(payment).toHaveProperty('amount')
    expect(payment).toHaveProperty('date')
  }

  // Cleanup
  async close() {
    await this.prisma.$disconnect()
  }
}

module.exports = { TestHelpers, testPrisma }
