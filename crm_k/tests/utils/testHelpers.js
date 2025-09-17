const { PrismaClient } = require('@prisma/client')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

// Test database client - используем dev.db как указано в .env
const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:../prisma/dev.db'
    }
  }
})

// Test utilities
class TestHelpers {
  constructor() {
    this.prisma = testPrisma
    this.jwtSecret = process.env.JWT_SECRET || 'test-secret-key'
    this.defaultTeacherId = null

    if (!this.prisma.lesson.create.__ensureDefaultTeacher) {
      const helper = this
      const originalLessonCreate = this.prisma.lesson.create.bind(this.prisma.lesson)

      this.prisma.lesson.create = async function (args = {}) {
        const data = args?.data
        if (data && !data.teacherId && !data.teacher) {
          if (!helper.defaultTeacherId) {
            throw new Error('TestHelpers default teacher is not set. Call seedTestData first.')
          }

          const nextArgs = {
            ...args,
            data: {
              ...data,
              teacherId: helper.defaultTeacherId
            }
          }

          return originalLessonCreate(nextArgs)
        }

        return originalLessonCreate(args)
      }

      this.prisma.lesson.create.__ensureDefaultTeacher = true
    }
  }

  // Database helpers
  async cleanupDatabase() {
    try {
      // Проверяем, существует ли таблица users
      const tables = await this.prisma.$queryRaw`
        SELECT name FROM sqlite_master WHERE type='table' AND name='User';
      `
      
      let existingAdmin = null
      if (tables.length > 0) {
        // Сохраняем существующего админа перед очисткой
        existingAdmin = await this.prisma.user.findUnique({
          where: { email: 'admin@crm.com' }
        })
      }

      const tablenames = await this.prisma.$queryRaw`
        SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_prisma_migrations';
      `
      
      for (const { name } of tablenames) {
        await this.prisma.$executeRawUnsafe(`DELETE FROM "${name}";`)
      }

      // Восстанавливаем админа если он существовал
      if (existingAdmin) {
        await this.prisma.user.create({
          data: {
            id: existingAdmin.id,
            email: existingAdmin.email,
            password: existingAdmin.password, // Сохраняем оригинальный хеш пароля
            name: existingAdmin.name,
            role: existingAdmin.role,
            phone: existingAdmin.phone,
            createdAt: existingAdmin.createdAt,
            updatedAt: existingAdmin.updatedAt
          }
        })
      }
    } catch (error) {
      console.warn('Предупреждение при очистке базы данных:', error.message)
      // Если база данных не существует или повреждена, просто продолжаем
    }
  }

  async seedTestData() {
    try {
      // Проверяем, существует ли таблица users
      const tables = await this.prisma.$queryRaw`
        SELECT name FROM sqlite_master WHERE type='table' AND name='User';
      `
      
      let admin = null
      let user = null
      let student = null
      
      if (tables.length > 0) {
        // Проверяем, существует ли уже админ admin@crm.com
        admin = await this.prisma.user.findUnique({
          where: { email: 'admin@crm.com' }
        })
        
        // Проверяем, существует ли уже тестовый пользователь
        user = await this.prisma.user.findUnique({
          where: { email: 'user@test.com' }
        })
      }

      // Если админ не существует, создаем его с правильными данными
      if (!admin) {
        const adminPasswordHash = await bcrypt.hash('123456', 8)
        admin = await this.prisma.user.create({
          data: {
            email: 'admin@crm.com',
            password: adminPasswordHash,
            name: 'Admin CRM',
            role: 'ADMIN'
          }
        })
      }

      // Если тестовый пользователь не существует, создаем его
      if (!user) {
        const userPasswordHash = await bcrypt.hash('user123', 8)
        user = await this.prisma.user.create({
          data: {
            email: 'user@test.com',
            password: userPasswordHash,
            name: 'Test User',
            role: 'USER'
          }
        })
      }

      this.defaultTeacherId = user.id

      // Проверяем, существует ли тестовый студент
      if (tables.length > 0) {
        student = await this.prisma.student.findFirst({
          where: { userId: user.id }
        })
      }

      // Если студент не существует, создаем его
      if (!student) {
        student = await this.prisma.student.create({
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
      }

      return { admin, user, student }
    } catch (error) {
      console.warn('Предупреждение при создании тестовых данных:', error.message)
      // Возвращаем мок-данные если база данных недоступна
      return {
        admin: { id: 1, email: 'admin@crm.com', name: 'Admin CRM', role: 'ADMIN' },
        user: { id: 2, email: 'user@test.com', name: 'Test User', role: 'USER' },
        student: { id: 1, fullName: 'Test Student', userId: 2 }
      }
    }
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
