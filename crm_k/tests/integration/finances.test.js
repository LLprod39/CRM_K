const { TestHelpers } = require('../utils/testHelpers')
const { createTestLesson, createTestPayment } = require('../fixtures/testData')

describe('Finances API', () => {
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

  describe('GET /api/finances/stats', () => {
    it('should return financial statistics for user', async () => {
      // Create some lessons and payments
      await testHelpers.prisma.lesson.create({
        data: {
          ...createTestLesson('individual', testData.student.id),
          isCompleted: true,
          isPaid: true
        }
      })

      await testHelpers.prisma.lesson.create({
        data: {
          ...createTestLesson('group', testData.student.id),
          isCompleted: true,
          isPaid: false
        }
      })

      await testHelpers.prisma.payment.create({
        data: createTestPayment('payment1', testData.student.id)
      })

      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/finances/stats', {
        headers
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('totalRevenue')
      expect(data).toHaveProperty('completedLessons')
      expect(data).toHaveProperty('totalDebt')
      expect(data).toHaveProperty('totalPrepaid')
      expect(data).toHaveProperty('userRevenue')
      expect(data).toHaveProperty('statusStats')
      
      expect(typeof data.totalRevenue).toBe('number')
      expect(typeof data.completedLessons).toBe('number')
      expect(typeof data.totalDebt).toBe('number')
      expect(typeof data.totalPrepaid).toBe('number')
      expect(typeof data.userRevenue).toBe('number')
      expect(Array.isArray(data.statusStats)).toBe(true)
    })

    it('should return all financial statistics for admin', async () => {
      // Create data for multiple users
      const user2 = await testHelpers.prisma.user.create({
        data: {
          email: 'user2@test.com',
          password: 'hash',
          name: 'User 2',
          role: 'USER'
        }
      })

      const student2 = await testHelpers.prisma.student.create({
        data: {
          fullName: 'Student 2',
          phone: '+7 (999) 222-22-22',
          age: 6,
          parentName: 'Parent 2',
          userId: user2.id
        }
      })

      await testHelpers.prisma.lesson.create({
        data: {
          ...createTestLesson('individual', testData.student.id),
          isCompleted: true,
          isPaid: true
        }
      })

      await testHelpers.prisma.lesson.create({
        data: {
          ...createTestLesson('individual', student2.id),
          isCompleted: true,
          isPaid: true
        }
      })

      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch('http://localhost:3000/api/finances/stats', {
        headers
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.totalRevenue).toBeGreaterThan(0)
      expect(data.completedLessons).toBe(2)
    })

    it('should filter statistics by date range', async () => {
      const baseDate = new Date('2025-01-15T10:00:00Z')
      
      // Create lessons on different dates
      await testHelpers.prisma.lesson.create({
        data: {
          ...createTestLesson('individual', testData.student.id),
          date: baseDate,
          isCompleted: true,
          isPaid: true
        }
      })

      await testHelpers.prisma.lesson.create({
        data: {
          ...createTestLesson('group', testData.student.id),
          date: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 days
          isCompleted: true,
          isPaid: true
        }
      })

      const headers = testHelpers.createAuthHeaders(testData.user)
      const startDate = testHelpers.createDateString(baseDate)
      const endDate = testHelpers.createDateString(new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000))
      
      const response = await fetch(`http://localhost:3000/api/finances/stats?startDate=${startDate}&endDate=${endDate}`, {
        headers
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.completedLessons).toBe(1)
    })

    it('should require authentication', async () => {
      const response = await fetch('http://localhost:3000/api/finances/stats')
      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/finances/revenue', () => {
    it('should return revenue chart data', async () => {
      // Create lessons with different dates
      const dates = [
        new Date('2025-01-01T10:00:00Z'),
        new Date('2025-01-02T10:00:00Z'),
        new Date('2025-01-03T10:00:00Z')
      ]

      for (const date of dates) {
        await testHelpers.prisma.lesson.create({
          data: {
            ...createTestLesson('individual', testData.student.id),
            date,
            isCompleted: true,
            isPaid: true
          }
        })
      }

      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/finances/revenue', {
        headers
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      
      data.forEach(item => {
        expect(item).toHaveProperty('date')
        expect(item).toHaveProperty('revenue')
        expect(typeof item.revenue).toBe('number')
      })
    })

    it('should filter revenue by period', async () => {
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/finances/revenue?period=week', {
        headers
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })

    it('should require authentication', async () => {
      const response = await fetch('http://localhost:3000/api/finances/revenue')
      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/finances/debts', () => {
    it('should return students with debts', async () => {
      // Create completed but unpaid lessons
      await testHelpers.prisma.lesson.create({
        data: {
          ...createTestLesson('individual', testData.student.id),
          isCompleted: true,
          isPaid: false
        }
      })

      await testHelpers.prisma.lesson.create({
        data: {
          ...createTestLesson('group', testData.student.id),
          isCompleted: true,
          isPaid: false
        }
      })

      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/finances/debts', {
        headers
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(1) // One student with debt
      
      const debtInfo = data[0]
      expect(debtInfo).toHaveProperty('student')
      expect(debtInfo).toHaveProperty('totalDebt')
      expect(debtInfo).toHaveProperty('unpaidLessons')
      expect(debtInfo.totalDebt).toBeGreaterThan(0)
      expect(debtInfo.unpaidLessons).toBe(2)
    })

    it('should return empty array when no debts', async () => {
      // Create only paid lessons
      await testHelpers.prisma.lesson.create({
        data: {
          ...createTestLesson('individual', testData.student.id),
          isCompleted: true,
          isPaid: true
        }
      })

      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/finances/debts', {
        headers
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(0)
    })

    it('should require authentication', async () => {
      const response = await fetch('http://localhost:3000/api/finances/debts')
      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/finances/prepaid', () => {
    it('should return prepaid lessons', async () => {
      // Create prepaid lessons (paid but not completed)
      await testHelpers.prisma.lesson.create({
        data: {
          ...createTestLesson('individual', testData.student.id),
          isCompleted: false,
          isPaid: true
        }
      })

      await testHelpers.prisma.lesson.create({
        data: {
          ...createTestLesson('group', testData.student.id),
          isCompleted: false,
          isPaid: true
        }
      })

      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/finances/prepaid', {
        headers
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(2)
      
      data.forEach(lesson => {
        expect(lesson.isPaid).toBe(true)
        expect(lesson.isCompleted).toBe(false)
      })
    })

    it('should require authentication', async () => {
      const response = await fetch('http://localhost:3000/api/finances/prepaid')
      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/finances/student/[id]', () => {
    it('should return financial report for student', async () => {
      // Create lessons and payments
      await testHelpers.prisma.lesson.create({
        data: {
          ...createTestLesson('individual', testData.student.id),
          isCompleted: true,
          isPaid: true
        }
      })

      await testHelpers.prisma.lesson.create({
        data: {
          ...createTestLesson('group', testData.student.id),
          isCompleted: true,
          isPaid: false
        }
      })

      await testHelpers.prisma.payment.create({
        data: createTestPayment('payment1', testData.student.id)
      })

      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch(`http://localhost:3000/api/finances/student/${testData.student.id}`, {
        headers
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('student')
      expect(data).toHaveProperty('totalPaid')
      expect(data).toHaveProperty('totalDebt')
      expect(data).toHaveProperty('lessonsCompleted')
      expect(data).toHaveProperty('lessonsPaid')
      expect(data).toHaveProperty('paymentHistory')
      
      expect(typeof data.totalPaid).toBe('number')
      expect(typeof data.totalDebt).toBe('number')
      expect(typeof data.lessonsCompleted).toBe('number')
      expect(typeof data.lessonsPaid).toBe('number')
      expect(Array.isArray(data.paymentHistory)).toBe(true)
    })

    it('should not allow user to view other user\'s student finances', async () => {
      // Create another user with student
      const user2 = await testHelpers.prisma.user.create({
        data: {
          email: 'user2@test.com',
          password: 'hash',
          name: 'User 2',
          role: 'USER'
        }
      })

      const student2 = await testHelpers.prisma.student.create({
        data: {
          fullName: 'Student 2',
          phone: '+7 (999) 222-22-22',
          age: 6,
          parentName: 'Parent 2',
          userId: user2.id
        }
      })

      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch(`http://localhost:3000/api/finances/student/${student2.id}`, {
        headers
      })

      expect(response.status).toBe(403)
    })

    it('should allow admin to view any student finances', async () => {
      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch(`http://localhost:3000/api/finances/student/${testData.student.id}`, {
        headers
      })

      expect(response.status).toBe(200)
    })

    it('should return 404 for non-existent student', async () => {
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/finances/student/99999', {
        headers
      })

      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/finances/export', () => {
    it('should export financial data', async () => {
      // Create some data
      await testHelpers.prisma.lesson.create({
        data: {
          ...createTestLesson('individual', testData.student.id),
          isCompleted: true,
          isPaid: true
        }
      })

      await testHelpers.prisma.payment.create({
        data: createTestPayment('payment1', testData.student.id)
      })

      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/finances/export', {
        headers
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    })

    it('should filter export by date range', async () => {
      const headers = testHelpers.createAuthHeaders(testData.user)
      const startDate = testHelpers.createDateString(new Date('2025-01-01'))
      const endDate = testHelpers.createDateString(new Date('2025-01-31'))
      
      const response = await fetch(`http://localhost:3000/api/finances/export?startDate=${startDate}&endDate=${endDate}`, {
        headers
      })

      expect(response.status).toBe(200)
    })

    it('should require authentication', async () => {
      const response = await fetch('http://localhost:3000/api/finances/export')
      expect(response.status).toBe(401)
    })
  })
})
