const { TestHelpers } = require('../utils/testHelpers')
const { createTestPayment } = require('../fixtures/testData')

describe('Payments API', () => {
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

  describe('GET /api/payments', () => {
    it('should return payments for authenticated user', async () => {
      // Create a payment for the student
      const payment = await testHelpers.prisma.payment.create({
        data: createTestPayment('payment1', testData.student.id)
      })

      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/payments', {
        headers
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(1)
      testHelpers.expectValidPayment(data[0])
    })

    it('should return all payments for admin', async () => {
      // Create another user with student and payment
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

      await testHelpers.prisma.payment.create({
        data: createTestPayment('payment1', testData.student.id)
      })

      await testHelpers.prisma.payment.create({
        data: createTestPayment('payment2', student2.id)
      })

      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch('http://localhost:3000/api/payments', {
        headers
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(2)
    })

    it('should filter payments by date range', async () => {
      const baseDate = new Date('2025-01-10T00:00:00Z')
      
      // Create payments on different dates
      await testHelpers.prisma.payment.create({
        data: {
          ...createTestPayment('payment1', testData.student.id),
          date: baseDate
        }
      })

      await testHelpers.prisma.payment.create({
        data: {
          ...createTestPayment('payment2', testData.student.id),
          date: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000) // +7 days
        }
      })

      const headers = testHelpers.createAuthHeaders(testData.user)
      const startDate = testHelpers.createDateString(baseDate)
      const endDate = testHelpers.createDateString(new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000))
      
      const response = await fetch(`http://localhost:3000/api/payments?startDate=${startDate}&endDate=${endDate}`, {
        headers
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.length).toBe(1)
    })

    it('should require authentication', async () => {
      const response = await fetch('http://localhost:3000/api/payments')
      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/payments', () => {
    it('should create new payment', async () => {
      const paymentData = createTestPayment('payment1', testData.student.id)
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/payments', {
        method: 'POST',
        headers,
        body: JSON.stringify(paymentData)
      })

      expect(response.status).toBe(201)
      
      const data = await response.json()
      testHelpers.expectValidPayment(data)
      expect(data.studentId).toBe(testData.student.id)
      expect(data.amount).toBe(paymentData.amount)
    })

    it('should create payment with lesson associations', async () => {
      // Create lessons first
      const lesson1 = await testHelpers.prisma.lesson.create({
        data: {
          date: new Date('2025-01-15T10:00:00Z'),
          endTime: new Date('2025-01-15T11:00:00Z'),
          studentId: testData.student.id,
          cost: 1500,
          isCompleted: true,
          isPaid: false,
          isCancelled: false,
          notes: 'Lesson 1',
          lessonType: 'individual',
          location: 'office'
        }
      })

      const lesson2 = await testHelpers.prisma.lesson.create({
        data: {
          date: new Date('2025-01-16T10:00:00Z'),
          endTime: new Date('2025-01-16T11:00:00Z'),
          studentId: testData.student.id,
          cost: 1500,
          isCompleted: true,
          isPaid: false,
          isCancelled: false,
          notes: 'Lesson 2',
          lessonType: 'individual',
          location: 'office'
        }
      })

      const paymentData = {
        ...createTestPayment('payment1', testData.student.id),
        lessonIds: [lesson1.id, lesson2.id]
      }
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/payments', {
        method: 'POST',
        headers,
        body: JSON.stringify(paymentData)
      })

      expect(response.status).toBe(201)
      
      const data = await response.json()
      expect(data).toHaveProperty('lessons')
      expect(data.lessons.length).toBe(2)
      
      // Verify lessons are marked as paid
      const updatedLesson1 = await testHelpers.prisma.lesson.findUnique({
        where: { id: lesson1.id }
      })
      const updatedLesson2 = await testHelpers.prisma.lesson.findUnique({
        where: { id: lesson2.id }
      })
      
      expect(updatedLesson1.isPaid).toBe(true)
      expect(updatedLesson2.isPaid).toBe(true)
    })

    it('should validate required fields', async () => {
      const invalidData = {
        studentId: testData.student.id
        // Missing amount and date
      }
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/payments', {
        method: 'POST',
        headers,
        body: JSON.stringify(invalidData)
      })

      expect(response.status).toBe(400)
    })

    it('should validate student exists', async () => {
      const paymentData = {
        ...createTestPayment('payment1', testData.student.id),
        studentId: 99999 // Non-existent student
      }
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/payments', {
        method: 'POST',
        headers,
        body: JSON.stringify(paymentData)
      })

      expect(response.status).toBe(400)
    })

    it('should allow admin to create payment for any student', async () => {
      const paymentData = createTestPayment('payment1', testData.student.id)
      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch('http://localhost:3000/api/payments', {
        method: 'POST',
        headers,
        body: JSON.stringify(paymentData)
      })

      expect(response.status).toBe(201)
    })

    it('should require authentication', async () => {
      const paymentData = createTestPayment('payment1', testData.student.id)
      
      const response = await fetch('http://localhost:3000/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      })

      expect(response.status).toBe(401)
    })
  })

  describe('PUT /api/payments/[id]', () => {
    let payment

    beforeEach(async () => {
      payment = await testHelpers.prisma.payment.create({
        data: createTestPayment('payment1', testData.student.id)
      })
    })

    it('should update payment', async () => {
      const updateData = {
        amount: 2000,
        description: 'Updated payment description'
      }
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch(`http://localhost:3000/api/payments/${payment.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.amount).toBe(updateData.amount)
      expect(data.description).toBe(updateData.description)
    })

    it('should not allow user to update other user\'s payment', async () => {
      // Create another user with student and payment
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

      const payment2 = await testHelpers.prisma.payment.create({
        data: createTestPayment('payment1', student2.id)
      })

      const updateData = { amount: 9999 }
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch(`http://localhost:3000/api/payments/${payment2.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(403)
    })

    it('should allow admin to update any payment', async () => {
      const updateData = { amount: 3000 }
      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch(`http://localhost:3000/api/payments/${payment.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.amount).toBe(updateData.amount)
    })

    it('should return 404 for non-existent payment', async () => {
      const updateData = { amount: 2000 }
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/payments/99999', {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/payments/[id]', () => {
    let payment

    beforeEach(async () => {
      payment = await testHelpers.prisma.payment.create({
        data: createTestPayment('payment1', testData.student.id)
      })
    })

    it('should delete payment', async () => {
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch(`http://localhost:3000/api/payments/${payment.id}`, {
        method: 'DELETE',
        headers
      })

      expect(response.status).toBe(200)
      
      // Verify payment is deleted
      const deletedPayment = await testHelpers.prisma.payment.findUnique({
        where: { id: payment.id }
      })
      expect(deletedPayment).toBeNull()
    })

    it('should not allow user to delete other user\'s payment', async () => {
      // Create another user with student and payment
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

      const payment2 = await testHelpers.prisma.payment.create({
        data: createTestPayment('payment1', student2.id)
      })

      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch(`http://localhost:3000/api/payments/${payment2.id}`, {
        method: 'DELETE',
        headers
      })

      expect(response.status).toBe(403)
    })

    it('should allow admin to delete any payment', async () => {
      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch(`http://localhost:3000/api/payments/${payment.id}`, {
        method: 'DELETE',
        headers
      })

      expect(response.status).toBe(200)
    })

    it('should return 404 for non-existent payment', async () => {
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/payments/99999', {
        method: 'DELETE',
        headers
      })

      expect(response.status).toBe(404)
    })
  })
})
