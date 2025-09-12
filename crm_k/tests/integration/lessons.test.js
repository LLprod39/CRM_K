const { TestHelpers } = require('../utils/testHelpers')
const { createTestLesson } = require('../fixtures/testData')

describe('Lessons API', () => {
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

  describe('GET /api/lessons', () => {
    it('should return lessons for authenticated user', async () => {
      // Create a lesson for the student
      const lesson = await testHelpers.prisma.lesson.create({
        data: createTestLesson('individual', testData.student.id)
      })

      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/lessons', {
        headers
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(1)
      testHelpers.expectValidLesson(data[0])
    })

    it('should return all lessons for admin', async () => {
      // Create another user with student and lesson
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
        data: createTestLesson('individual', testData.student.id)
      })

      await testHelpers.prisma.lesson.create({
        data: createTestLesson('group', student2.id)
      })

      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch('http://localhost:3000/api/lessons', {
        headers
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(2)
    })

    it('should filter lessons by date range', async () => {
      const baseDate = new Date('2025-01-15T10:00:00Z')
      
      // Create lessons on different dates
      await testHelpers.prisma.lesson.create({
        data: {
          ...createTestLesson('individual', testData.student.id),
          date: baseDate
        }
      })

      await testHelpers.prisma.lesson.create({
        data: {
          ...createTestLesson('group', testData.student.id),
          date: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000) // +7 days
        }
      })

      const headers = testHelpers.createAuthHeaders(testData.user)
      const startDate = testHelpers.createDateString(baseDate)
      const endDate = testHelpers.createDateString(new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000))
      
      const response = await fetch(`http://localhost:3000/api/lessons?startDate=${startDate}&endDate=${endDate}`, {
        headers
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.length).toBe(1)
    })

    it('should require authentication', async () => {
      const response = await fetch('http://localhost:3000/api/lessons')
      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/lessons', () => {
    it('should create new individual lesson', async () => {
      const lessonData = createTestLesson('individual', testData.student.id)
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/lessons', {
        method: 'POST',
        headers,
        body: JSON.stringify(lessonData)
      })

      expect(response.status).toBe(201)
      
      const data = await response.json()
      testHelpers.expectValidLesson(data)
      expect(data.studentId).toBe(testData.student.id)
      expect(data.lessonType).toBe('individual')
    })

    it('should create group lesson', async () => {
      // Create another student for group lesson
      const student2 = await testHelpers.prisma.student.create({
        data: {
          fullName: 'Student 2',
          phone: '+7 (999) 222-22-22',
          age: 6,
          parentName: 'Parent 2',
          userId: testData.user.id
        }
      })

      const lessonData = {
        ...createTestLesson('group', testData.student.id),
        studentIds: [testData.student.id, student2.id]
      }
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/lessons', {
        method: 'POST',
        headers,
        body: JSON.stringify(lessonData)
      })

      expect(response.status).toBe(201)
      
      const data = await response.json()
      expect(data.lessonType).toBe('group')
    })

    it('should validate required fields', async () => {
      const invalidData = {
        studentId: testData.student.id
        // Missing required fields
      }
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/lessons', {
        method: 'POST',
        headers,
        body: JSON.stringify(invalidData)
      })

      expect(response.status).toBe(400)
    })

    it('should validate lesson time conflicts', async () => {
      const baseDate = new Date('2025-01-15T10:00:00Z')
      
      // Create existing lesson
      await testHelpers.prisma.lesson.create({
        data: {
          ...createTestLesson('individual', testData.student.id),
          date: baseDate,
          endTime: new Date(baseDate.getTime() + 60 * 60 * 1000) // +1 hour
        }
      })

      // Try to create conflicting lesson
      const conflictingData = {
        ...createTestLesson('individual', testData.student.id),
        date: baseDate,
        endTime: new Date(baseDate.getTime() + 30 * 60 * 1000) // +30 minutes (overlaps)
      }
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/lessons', {
        method: 'POST',
        headers,
        body: JSON.stringify(conflictingData)
      })

      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data).toHaveProperty('error')
    })

    it('should allow admin to create lesson for any student', async () => {
      const lessonData = createTestLesson('individual', testData.student.id)
      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch('http://localhost:3000/api/lessons', {
        method: 'POST',
        headers,
        body: JSON.stringify(lessonData)
      })

      expect(response.status).toBe(201)
    })
  })

  describe('PUT /api/lessons/[id]', () => {
    let lesson

    beforeEach(async () => {
      lesson = await testHelpers.prisma.lesson.create({
        data: createTestLesson('individual', testData.student.id)
      })
    })

    it('should update lesson', async () => {
      const updateData = {
        cost: 2000,
        notes: 'Updated notes',
        isCompleted: true
      }
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch(`http://localhost:3000/api/lessons/${lesson.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.cost).toBe(updateData.cost)
      expect(data.notes).toBe(updateData.notes)
      expect(data.isCompleted).toBe(updateData.isCompleted)
    })

    it('should update lesson status', async () => {
      const updateData = {
        isCompleted: true,
        isPaid: true,
        comment: 'Great lesson!'
      }
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch(`http://localhost:3000/api/lessons/${lesson.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.isCompleted).toBe(true)
      expect(data.isPaid).toBe(true)
      expect(data.comment).toBe(updateData.comment)
    })

    it('should not allow user to update other user\'s lesson', async () => {
      // Create another user with student and lesson
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

      const lesson2 = await testHelpers.prisma.lesson.create({
        data: createTestLesson('individual', student2.id)
      })

      const updateData = { cost: 9999 }
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch(`http://localhost:3000/api/lessons/${lesson2.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(403)
    })

    it('should allow admin to update any lesson', async () => {
      const updateData = { cost: 3000 }
      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch(`http://localhost:3000/api/lessons/${lesson.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.cost).toBe(updateData.cost)
    })
  })

  describe('DELETE /api/lessons/[id]', () => {
    let lesson

    beforeEach(async () => {
      lesson = await testHelpers.prisma.lesson.create({
        data: createTestLesson('individual', testData.student.id)
      })
    })

    it('should delete lesson', async () => {
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch(`http://localhost:3000/api/lessons/${lesson.id}`, {
        method: 'DELETE',
        headers
      })

      expect(response.status).toBe(200)
      
      // Verify lesson is deleted
      const deletedLesson = await testHelpers.prisma.lesson.findUnique({
        where: { id: lesson.id }
      })
      expect(deletedLesson).toBeNull()
    })

    it('should not allow user to delete other user\'s lesson', async () => {
      // Create another user with student and lesson
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

      const lesson2 = await testHelpers.prisma.lesson.create({
        data: createTestLesson('individual', student2.id)
      })

      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch(`http://localhost:3000/api/lessons/${lesson2.id}`, {
        method: 'DELETE',
        headers
      })

      expect(response.status).toBe(403)
    })

    it('should allow admin to delete any lesson', async () => {
      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch(`http://localhost:3000/api/lessons/${lesson.id}`, {
        method: 'DELETE',
        headers
      })

      expect(response.status).toBe(200)
    })
  })
})
