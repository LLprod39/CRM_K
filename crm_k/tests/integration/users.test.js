const { TestHelpers } = require('../utils/testHelpers')
const { createTestUser } = require('../fixtures/testData')

describe('Users Management API', () => {
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

  describe('GET /api/admin/users', () => {
    it('should return all users for admin', async () => {
      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch('http://localhost:3000/api/admin/users', {
        headers
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      
      data.forEach(user => {
        testHelpers.expectValidUser(user)
        expect(user).not.toHaveProperty('password') // Password should not be returned
      })
    })

    it('should deny access to non-admin users', async () => {
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/admin/users', {
        headers
      })

      expect(response.status).toBe(403)
    })

    it('should require authentication', async () => {
      const response = await fetch('http://localhost:3000/api/admin/users')
      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/admin/users', () => {
    it('should create new user (admin only)', async () => {
      const userData = createTestUser('user2')
      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch('http://localhost:3000/api/admin/users', {
        method: 'POST',
        headers,
        body: JSON.stringify(userData)
      })

      expect(response.status).toBe(201)
      
      const data = await response.json()
      testHelpers.expectValidUser(data)
      expect(data.email).toBe(userData.email)
      expect(data.name).toBe(userData.name)
      expect(data.role).toBe(userData.role)
      expect(data).not.toHaveProperty('password')
    })

    it('should validate required fields', async () => {
      const invalidData = {
        email: 'test@example.com'
        // Missing password and name
      }
      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch('http://localhost:3000/api/admin/users', {
        method: 'POST',
        headers,
        body: JSON.stringify(invalidData)
      })

      expect(response.status).toBe(400)
    })

    it('should validate unique email', async () => {
      const userData = {
        ...createTestUser('user2'),
        email: testData.user.email // Duplicate email
      }
      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch('http://localhost:3000/api/admin/users', {
        method: 'POST',
        headers,
        body: JSON.stringify(userData)
      })

      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toContain('уже существует')
    })

    it('should validate email format', async () => {
      const userData = {
        ...createTestUser('user2'),
        email: 'invalid-email'
      }
      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch('http://localhost:3000/api/admin/users', {
        method: 'POST',
        headers,
        body: JSON.stringify(userData)
      })

      expect(response.status).toBe(400)
    })

    it('should deny access to non-admin users', async () => {
      const userData = createTestUser('user2')
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch('http://localhost:3000/api/admin/users', {
        method: 'POST',
        headers,
        body: JSON.stringify(userData)
      })

      expect(response.status).toBe(403)
    })
  })

  describe('PUT /api/admin/users/[id]', () => {
    it('should update user (admin only)', async () => {
      const updateData = {
        name: 'Updated User Name',
        role: 'ADMIN'
      }
      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch(`http://localhost:3000/api/admin/users/${testData.user.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.name).toBe(updateData.name)
      expect(data.role).toBe(updateData.role)
    })

    it('should update user password', async () => {
      const updateData = {
        password: 'newpassword123'
      }
      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch(`http://localhost:3000/api/admin/users/${testData.user.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).not.toHaveProperty('password')
      
      // Verify password was updated by trying to login
      const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testData.user.email,
          password: 'newpassword123'
        })
      })
      
      expect(loginResponse.status).toBe(200)
    })

    it('should validate email uniqueness on update', async () => {
      // Create another user
      const user2 = await testHelpers.prisma.user.create({
        data: createTestUser('user2')
      })

      const updateData = {
        email: testData.user.email // Duplicate email
      }
      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch(`http://localhost:3000/api/admin/users/${user2.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(400)
    })

    it('should return 404 for non-existent user', async () => {
      const updateData = { name: 'Updated Name' }
      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch('http://localhost:3000/api/admin/users/99999', {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(404)
    })

    it('should deny access to non-admin users', async () => {
      const updateData = { name: 'Updated Name' }
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch(`http://localhost:3000/api/admin/users/${testData.user.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(403)
    })
  })

  describe('DELETE /api/admin/users/[id]', () => {
    it('should delete user (admin only)', async () => {
      // Create a user to delete
      const userToDelete = await testHelpers.prisma.user.create({
        data: createTestUser('user2')
      })

      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch(`http://localhost:3000/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers
      })

      expect(response.status).toBe(200)
      
      // Verify user is deleted
      const deletedUser = await testHelpers.prisma.user.findUnique({
        where: { id: userToDelete.id }
      })
      expect(deletedUser).toBeNull()
    })

    it('should cascade delete user\'s students and lessons', async () => {
      // Create user with students and lessons
      const userToDelete = await testHelpers.prisma.user.create({
        data: createTestUser('user2')
      })

      const student = await testHelpers.prisma.student.create({
        data: {
          fullName: 'Student',
          phone: '+7 (999) 999-99-99',
          age: 5,
          parentName: 'Parent',
          userId: userToDelete.id
        }
      })

      const lesson = await testHelpers.prisma.lesson.create({
        data: {
          date: new Date('2025-01-15T10:00:00Z'),
          endTime: new Date('2025-01-15T11:00:00Z'),
          studentId: student.id,
          cost: 1500,
          isCompleted: false,
          isPaid: false,
          isCancelled: false,
          notes: 'Test lesson',
          lessonType: 'individual',
          location: 'office'
        }
      })

      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch(`http://localhost:3000/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers
      })

      expect(response.status).toBe(200)
      
      // Verify cascade deletion
      const deletedStudent = await testHelpers.prisma.student.findUnique({
        where: { id: student.id }
      })
      const deletedLesson = await testHelpers.prisma.lesson.findUnique({
        where: { id: lesson.id }
      })
      
      expect(deletedStudent).toBeNull()
      expect(deletedLesson).toBeNull()
    })

    it('should not allow deleting admin user', async () => {
      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch(`http://localhost:3000/api/admin/users/${testData.admin.id}`, {
        method: 'DELETE',
        headers
      })

      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toContain('нельзя удалить')
    })

    it('should return 404 for non-existent user', async () => {
      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch('http://localhost:3000/api/admin/users/99999', {
        method: 'DELETE',
        headers
      })

      expect(response.status).toBe(404)
    })

    it('should deny access to non-admin users', async () => {
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch(`http://localhost:3000/api/admin/users/${testData.user.id}`, {
        method: 'DELETE',
        headers
      })

      expect(response.status).toBe(403)
    })
  })

  describe('GET /api/admin/users/[id]/stats', () => {
    it('should return user statistics (admin only)', async () => {
      // Create some data for the user
      await testHelpers.prisma.lesson.create({
        data: {
          date: new Date('2025-01-15T10:00:00Z'),
          endTime: new Date('2025-01-15T11:00:00Z'),
          studentId: testData.student.id,
          cost: 1500,
          isCompleted: true,
          isPaid: true,
          isCancelled: false,
          notes: 'Test lesson',
          lessonType: 'individual',
          location: 'office'
        }
      })

      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch(`http://localhost:3000/api/admin/users/${testData.user.id}/stats`, {
        headers
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('totalStudents')
      expect(data).toHaveProperty('totalLessons')
      expect(data).toHaveProperty('completedLessons')
      expect(data).toHaveProperty('paidLessons')
      expect(data).toHaveProperty('totalRevenue')
      expect(data).toHaveProperty('totalDebt')
      
      expect(typeof data.totalStudents).toBe('number')
      expect(typeof data.totalLessons).toBe('number')
      expect(typeof data.completedLessons).toBe('number')
      expect(typeof data.paidLessons).toBe('number')
      expect(typeof data.totalRevenue).toBe('number')
      expect(typeof data.totalDebt).toBe('number')
    })

    it('should return 404 for non-existent user', async () => {
      const headers = testHelpers.createAuthHeaders(testData.admin)
      
      const response = await fetch('http://localhost:3000/api/admin/users/99999/stats', {
        headers
      })

      expect(response.status).toBe(404)
    })

    it('should deny access to non-admin users', async () => {
      const headers = testHelpers.createAuthHeaders(testData.user)
      
      const response = await fetch(`http://localhost:3000/api/admin/users/${testData.user.id}/stats`, {
        headers
      })

      expect(response.status).toBe(403)
    })
  })
})
