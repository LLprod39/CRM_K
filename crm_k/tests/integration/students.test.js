const { TestHelpers } = require('../utils/testHelpers')
const { createTestStudent } = require('../fixtures/testData')

describe('Students API', () => {
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

  describe('GET /api/students', () => {
    it('should return students for authenticated user', async () => {
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/students', {
        headers
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(1) // Only one student seeded
      testHelpers.expectValidStudent(data[0])
    })

    it('should return all students for admin', async () => {
      // Create another user with student
      const user2 = await testHelpers.prisma.user.create({
        data: {
          email: 'user2@test.com',
          password: 'hash',
          name: 'User 2',
          role: 'USER'
        }
      })

      await testHelpers.prisma.student.create({
        data: createTestStudent('student2', user2.id)
      })

      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch('http://localhost:3000/api/students', {
        headers
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(2) // Both students
    })

    it('should require authentication', async () => {
      const response = await fetch('http://localhost:3000/api/students')
      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/students', () => {
    it('should create new student', async () => {
      const studentData = createTestStudent('student2', testData.user.id)
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/students', {
        method: 'POST',
        headers,
        body: JSON.stringify(studentData)
      })

      expect(response.status).toBe(201)
      
      const data = await response.json()
      testHelpers.expectValidStudent(data)
      expect(data.fullName).toBe(studentData.fullName)
      expect(data.userId).toBe(testData.user.id)
    })

    it('should validate required fields', async () => {
      const invalidData = {
        fullName: 'Test Student'
        // Missing required fields
      }
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/students', {
        method: 'POST',
        headers,
        body: JSON.stringify(invalidData)
      })

      expect(response.status).toBe(400)
    })

    it('should allow admin to create student for any user', async () => {
      const studentData = createTestStudent('student2', testData.user.id)
      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch('http://localhost:3000/api/students', {
        method: 'POST',
        headers,
        body: JSON.stringify(studentData)
      })

      expect(response.status).toBe(201)
      
      const data = await response.json()
      expect(data.userId).toBe(testData.user.id)
    })

    it('should require authentication', async () => {
      const studentData = createTestStudent('student2', testData.user.id)
      
      const response = await fetch('http://localhost:3000/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData)
      })

      expect(response.status).toBe(401)
    })
  })

  describe('PUT /api/students/[id]', () => {
    it('should update student', async () => {
      const updateData = {
        fullName: 'Updated Student Name',
        age: 6
      }
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch(`http://localhost:3000/api/students/${testData.student.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.fullName).toBe(updateData.fullName)
      expect(data.age).toBe(updateData.age)
    })

    it('should not allow user to update other user\'s student', async () => {
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
        data: createTestStudent('student2', user2.id)
      })

      const updateData = { fullName: 'Hacked Name' }
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch(`http://localhost:3000/api/students/${student2.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(403)
    })

    it('should allow admin to update any student', async () => {
      const updateData = { fullName: 'Admin Updated Name' }
      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch(`http://localhost:3000/api/students/${testData.student.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.fullName).toBe(updateData.fullName)
    })

    it('should return 404 for non-existent student', async () => {
      const updateData = { fullName: 'Updated Name' }
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/students/99999', {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/students/[id]', () => {
    it('should delete student', async () => {
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch(`http://localhost:3000/api/students/${testData.student.id}`, {
        method: 'DELETE',
        headers
      })

      expect(response.status).toBe(200)
      
      // Verify student is deleted
      const student = await testHelpers.prisma.student.findUnique({
        where: { id: testData.student.id }
      })
      expect(student).toBeNull()
    })

    it('should not allow user to delete other user\'s student', async () => {
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
        data: createTestStudent('student2', user2.id)
      })

      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch(`http://localhost:3000/api/students/${student2.id}`, {
        method: 'DELETE',
        headers
      })

      expect(response.status).toBe(403)
    })

    it('should allow admin to delete any student', async () => {
      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch(`http://localhost:3000/api/students/${testData.student.id}`, {
        method: 'DELETE',
        headers
      })

      expect(response.status).toBe(200)
    })

    it('should return 404 for non-existent student', async () => {
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/students/99999', {
        method: 'DELETE',
        headers
      })

      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/students/[id]', () => {
    it('should return student details', async () => {
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch(`http://localhost:3000/api/students/${testData.student.id}`, {
        headers
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      testHelpers.expectValidStudent(data)
      expect(data.id).toBe(testData.student.id)
    })

    it('should include lessons for student', async () => {
      // Create a lesson for the student
      await testHelpers.prisma.lesson.create({
        data: {
          date: new Date('2025-01-15T10:00:00Z'),
          endTime: new Date('2025-01-15T11:00:00Z'),
          studentId: testData.student.id,
          cost: 1500,
          isCompleted: false,
          isPaid: false,
          isCancelled: false,
          notes: 'Test lesson',
          lessonType: 'individual',
          location: 'office'
        }
      })

      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch(`http://localhost:3000/api/students/${testData.student.id}`, {
        headers
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('lessons')
      expect(Array.isArray(data.lessons)).toBe(true)
      expect(data.lessons.length).toBe(1)
    })

    it('should not allow user to view other user\'s student', async () => {
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
        data: createTestStudent('student2', user2.id)
      })

      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch(`http://localhost:3000/api/students/${student2.id}`, {
        headers
      })

      expect(response.status).toBe(403)
    })

    it('should allow admin to view any student', async () => {
      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch(`http://localhost:3000/api/students/${testData.student.id}`, {
        headers
      })

      expect(response.status).toBe(200)
    })
  })
})
