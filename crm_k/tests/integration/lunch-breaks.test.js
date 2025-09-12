const { TestHelpers } = require('../utils/testHelpers')
const { createTestLunchBreak } = require('../fixtures/testData')

describe('Lunch Breaks API', () => {
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

  describe('GET /api/lunch-breaks', () => {
    it('should return lunch break for specific date', async () => {
      const lunchBreakData = createTestLunchBreak('lunch1', testData.user.id)
      await testHelpers.prisma.lunchBreak.create({
        data: lunchBreakData
      })

      const headers = testHelpers.createAuthHeaders(testData.user)
      const date = testHelpers.createDateString(new Date(lunchBreakData.date))
      
      const response = await fetch(`http://localhost:3000/api/lunch-breaks?date=${date}`, {
        headers
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('lunchBreak')
      expect(data.lunchBreak).not.toBeNull()
      expect(data.lunchBreak.userId).toBe(testData.user.id)
    })

    it('should return null if no lunch break for date', async () => {
      const headers = testHelpers.createAuthHeaders(testData.user)
      const date = testHelpers.createDateString(new Date('2025-01-20'))
      
      const response = await fetch(`http://localhost:3000/api/lunch-breaks?date=${date}`, {
        headers
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.lunchBreak).toBeNull()
    })

    it('should return all lunch breaks for admin', async () => {
      // Create lunch breaks for different users
      const user2 = await testHelpers.prisma.user.create({
        data: {
          email: 'user2@test.com',
          password: 'hash',
          name: 'User 2',
          role: 'USER'
        }
      })

      const lunchBreak1 = await testHelpers.prisma.lunchBreak.create({
        data: createTestLunchBreak('lunch1', testData.user.id)
      })

      const lunchBreak2 = await testHelpers.prisma.lunchBreak.create({
        data: createTestLunchBreak('lunch2', user2.id)
      })

      const headers = testHelpers.createAuthHeaders(testData.admin)
      const date = testHelpers.createDateString(new Date(lunchBreak1.date))
      
      const response = await fetch(`http://localhost:3000/api/lunch-breaks?date=${date}`, {
        headers
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('lunchBreaks')
      expect(Array.isArray(data.lunchBreaks)).toBe(true)
      expect(data.lunchBreaks.length).toBeGreaterThan(0)
    })

    it('should require date parameter', async () => {
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/lunch-breaks', {
        headers
      })

      expect(response.status).toBe(400)
    })

    it('should require authentication', async () => {
      const date = testHelpers.createDateString(new Date())
      
      const response = await fetch(`http://localhost:3000/api/lunch-breaks?date=${date}`)
      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/lunch-breaks', () => {
    it('should create new lunch break', async () => {
      const lunchBreakData = createTestLunchBreak('lunch1', testData.user.id)
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/lunch-breaks', {
        method: 'POST',
        headers,
        body: JSON.stringify(lunchBreakData)
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('lunchBreak')
      expect(data.lunchBreak.userId).toBe(testData.user.id)
      expect(data.lunchBreak.date).toBe(lunchBreakData.date)
    })

    it('should update existing lunch break for same date', async () => {
      // Create initial lunch break
      const initialData = createTestLunchBreak('lunch1', testData.user.id)
      await testHelpers.prisma.lunchBreak.create({
        data: initialData
      })

      // Update with new time
      const updateData = {
        ...initialData,
        startTime: new Date('2025-01-15T13:00:00Z'),
        endTime: new Date('2025-01-15T14:00:00Z')
      }
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/lunch-breaks', {
        method: 'POST',
        headers,
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.lunchBreak.startTime).toBe(updateData.startTime)
      expect(data.lunchBreak.endTime).toBe(updateData.endTime)
    })

    it('should validate required fields', async () => {
      const invalidData = {
        date: '2025-01-15'
        // Missing startTime and endTime
      }
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/lunch-breaks', {
        method: 'POST',
        headers,
        body: JSON.stringify(invalidData)
      })

      expect(response.status).toBe(400)
    })

    it('should check for lesson conflicts', async () => {
      // Create a lesson that conflicts with lunch break
      const lessonDate = new Date('2025-01-15T12:30:00Z')
      await testHelpers.prisma.lesson.create({
        data: {
          date: lessonDate,
          endTime: new Date(lessonDate.getTime() + 60 * 60 * 1000), // +1 hour
          studentId: testData.student.id,
          cost: 1500,
          isCompleted: false,
          isPaid: false,
          isCancelled: false,
          notes: 'Conflicting lesson',
          lessonType: 'individual',
          location: 'office'
        }
      })

      const lunchBreakData = {
        date: new Date('2025-01-15T00:00:00Z'),
        startTime: new Date('2025-01-15T12:00:00Z'),
        endTime: new Date('2025-01-15T13:00:00Z')
      }
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/lunch-breaks', {
        method: 'POST',
        headers,
        body: JSON.stringify(lunchBreakData)
      })

      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data).toHaveProperty('error')
      expect(data.error).toContain('конфликтует')
    })

    it('should not allow admin to create lunch break', async () => {
      const lunchBreakData = createTestLunchBreak('lunch1', testData.admin.id)
      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch('http://localhost:3000/api/lunch-breaks', {
        method: 'POST',
        headers,
        body: JSON.stringify(lunchBreakData)
      })

      expect(response.status).toBe(403)
      
      const data = await response.json()
      expect(data.error).toContain('Администратор не может')
    })

    it('should require authentication', async () => {
      const lunchBreakData = createTestLunchBreak('lunch1', testData.user.id)
      
      const response = await fetch('http://localhost:3000/api/lunch-breaks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lunchBreakData)
      })

      expect(response.status).toBe(401)
    })
  })

  describe('PUT /api/lunch-breaks', () => {
    let lunchBreak

    beforeEach(async () => {
      lunchBreak = await testHelpers.prisma.lunchBreak.create({
        data: createTestLunchBreak('lunch1', testData.user.id)
      })
    })

    it('should update lunch break (admin only)', async () => {
      const updateData = {
        lunchBreakId: lunchBreak.id,
        date: lunchBreak.date,
        startTime: new Date('2025-01-15T13:00:00Z'),
        endTime: new Date('2025-01-15T14:00:00Z')
      }
      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch('http://localhost:3000/api/lunch-breaks', {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.lunchBreak.startTime).toBe(updateData.startTime)
      expect(data.lunchBreak.endTime).toBe(updateData.endTime)
    })

    it('should not allow user to update lunch break', async () => {
      const updateData = {
        lunchBreakId: lunchBreak.id,
        date: lunchBreak.date,
        startTime: new Date('2025-01-15T13:00:00Z'),
        endTime: new Date('2025-01-15T14:00:00Z')
      }
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/lunch-breaks', {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(403)
    })

    it('should validate required fields', async () => {
      const invalidData = {
        lunchBreakId: lunchBreak.id
        // Missing other required fields
      }
      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch('http://localhost:3000/api/lunch-breaks', {
        method: 'PUT',
        headers,
        body: JSON.stringify(invalidData)
      })

      expect(response.status).toBe(400)
    })

    it('should return 404 for non-existent lunch break', async () => {
      const updateData = {
        lunchBreakId: 99999,
        date: new Date('2025-01-15T00:00:00Z'),
        startTime: new Date('2025-01-15T13:00:00Z'),
        endTime: new Date('2025-01-15T14:00:00Z')
      }
      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch('http://localhost:3000/api/lunch-breaks', {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/lunch-breaks', () => {
    let lunchBreak

    beforeEach(async () => {
      lunchBreak = await testHelpers.prisma.lunchBreak.create({
        data: createTestLunchBreak('lunch1', testData.user.id)
      })
    })

    it('should delete lunch break by date (user)', async () => {
      const headers = testHelpers.createAuthHeaders(testData.user)
      const date = testHelpers.createDateString(new Date(lunchBreak.date))
      
      const response = await fetch(`http://localhost:3000/api/lunch-breaks?date=${date}`, {
        method: 'DELETE',
        headers
      })

      expect(response.status).toBe(200)
      
      // Verify lunch break is deleted
      const deletedBreak = await testHelpers.prisma.lunchBreak.findUnique({
        where: { id: lunchBreak.id }
      })
      expect(deletedBreak).toBeNull()
    })

    it('should delete lunch break by ID (admin)', async () => {
      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch(`http://localhost:3000/api/lunch-breaks?lunchBreakId=${lunchBreak.id}`, {
        method: 'DELETE',
        headers
      })

      expect(response.status).toBe(200)
    })

    it('should not allow user to delete other user\'s lunch break', async () => {
      // Create another user with lunch break
      const user2 = await testHelpers.prisma.user.create({
        data: {
          email: 'user2@test.com',
          password: 'hash',
          name: 'User 2',
          role: 'USER'
        }
      })

      const lunchBreak2 = await testHelpers.prisma.lunchBreak.create({
        data: createTestLunchBreak('lunch2', user2.id)
      })

      const headers = testHelpers.createAuthHeaders(testData.user)
      const date = testHelpers.createDateString(new Date(lunchBreak2.date))
      
      const response = await fetch(`http://localhost:3000/api/lunch-breaks?date=${date}`, {
        method: 'DELETE',
        headers
      })

      expect(response.status).toBe(404) // Should not find lunch break for this user
    })

    it('should return 404 for non-existent lunch break', async () => {
      const headers = testHelpers.createAuthHeaders(testData.user)
      const date = testHelpers.createDateString(new Date('2025-01-20'))
      
      const response = await fetch(`http://localhost:3000/api/lunch-breaks?date=${date}`, {
        method: 'DELETE',
        headers
      })

      expect(response.status).toBe(404)
    })

    it('should require authentication', async () => {
      const date = testHelpers.createDateString(new Date(lunchBreak.date))
      
      const response = await fetch(`http://localhost:3000/api/lunch-breaks?date=${date}`, {
        method: 'DELETE'
      })

      expect(response.status).toBe(401)
    })
  })
})
