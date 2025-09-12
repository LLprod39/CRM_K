const { TestHelpers } = require('../utils/testHelpers')

describe('End-to-End Application Tests', () => {
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

  describe('Login Flow', () => {
    it('should complete login flow and redirect to dashboard', async () => {
      // This would typically use a browser automation tool like Playwright or Cypress
      // For now, we'll test the API endpoints that the frontend would call
      
      const loginData = {
        email: testData.user.email,
        password: 'user123'
      }

      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('token')
      expect(data).toHaveProperty('user')
      expect(data.user.email).toBe(loginData.email)
    })

    it('should handle login errors gracefully', async () => {
      const loginData = {
        email: 'nonexistent@test.com',
        password: 'wrongpassword'
      }

      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      })

      expect(response.status).toBe(401)
      
      const data = await response.json()
      expect(data).toHaveProperty('error')
    })
  })

  describe('Dashboard Flow', () => {
    it('should load dashboard data for authenticated user', async () => {
      const headers = testHelpers.createAuthHeaders(testData.user)

      // Test multiple dashboard endpoints
      const endpoints = [
        '/api/students',
        '/api/lessons',
        '/api/finances/stats',
        '/api/payments'
      ]

      for (const endpoint of endpoints) {
        const response = await fetch(`http://localhost:3000${endpoint}`, { headers })
        expect(response.status).toBe(200)
      }
    })

    it('should show different data for admin vs regular user', async () => {
      const userHeaders = testHelpers.createAuthHeaders(testData.user)
      const adminHeaders = testHelpers.createAuthHeaders(testData.admin)

      // Regular user should see only their students
      const userStudentsResponse = await fetch('http://localhost:3000/api/students', { headers: userHeaders })
      expect(userStudentsResponse.status).toBe(200)
      const userStudents = await userStudentsResponse.json()
      expect(userStudents.length).toBe(1)

      // Admin should see all students
      const adminStudentsResponse = await fetch('http://localhost:3000/api/students', { headers: adminHeaders })
      expect(adminStudentsResponse.status).toBe(200)
      const adminStudents = await adminStudentsResponse.json()
      expect(adminStudents.length).toBe(1) // Same in this case, but admin has access to all

      // Admin should have access to admin endpoints
      const adminUsersResponse = await fetch('http://localhost:3000/api/admin/users', { headers: adminHeaders })
      expect(adminUsersResponse.status).toBe(200)

      // Regular user should not have access to admin endpoints
      const userAdminResponse = await fetch('http://localhost:3000/api/admin/users', { headers: userHeaders })
      expect(userAdminResponse.status).toBe(403)
    })
  })

  describe('Student Management Flow', () => {
    it('should complete student CRUD operations', async () => {
      const headers = testHelpers.createAuthHeaders(testData.user)

      // Create student
      const studentData = {
        fullName: 'E2E Test Student',
        phone: '+7 (999) 888-77-66',
        age: 5,
        parentName: 'E2E Test Parent',
        diagnosis: 'E2E Test Diagnosis',
        comment: 'E2E Test Comment'
      }

      const createResponse = await fetch('http://localhost:3000/api/students', {
        method: 'POST',
        headers,
        body: JSON.stringify(studentData)
      })
      expect(createResponse.status).toBe(201)
      const newStudent = await createResponse.json()

      // Read student
      const readResponse = await fetch(`http://localhost:3000/api/students/${newStudent.id}`, { headers })
      expect(readResponse.status).toBe(200)
      const student = await readResponse.json()
      expect(student.fullName).toBe(studentData.fullName)

      // Update student
      const updateData = { fullName: 'Updated E2E Student' }
      const updateResponse = await fetch(`http://localhost:3000/api/students/${newStudent.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      })
      expect(updateResponse.status).toBe(200)
      const updatedStudent = await updateResponse.json()
      expect(updatedStudent.fullName).toBe(updateData.fullName)

      // Delete student
      const deleteResponse = await fetch(`http://localhost:3000/api/students/${newStudent.id}`, {
        method: 'DELETE',
        headers
      })
      expect(deleteResponse.status).toBe(200)

      // Verify deletion
      const verifyResponse = await fetch(`http://localhost:3000/api/students/${newStudent.id}`, { headers })
      expect(verifyResponse.status).toBe(404)
    })
  })

  describe('Lesson Scheduling Flow', () => {
    it('should handle lesson scheduling with conflict detection', async () => {
      const headers = testHelpers.createAuthHeaders(testData.user)

      // Create first lesson
      const lesson1Data = {
        date: '2025-01-15T10:00:00Z',
        endTime: '2025-01-15T11:00:00Z',
        studentId: testData.student.id,
        cost: 1500,
        notes: 'First lesson',
        lessonType: 'individual',
        location: 'office'
      }

      const createLesson1Response = await fetch('http://localhost:3000/api/lessons', {
        method: 'POST',
        headers,
        body: JSON.stringify(lesson1Data)
      })
      expect(createLesson1Response.status).toBe(201)

      // Try to create conflicting lesson
      const conflictingLessonData = {
        ...lesson1Data,
        date: '2025-01-15T10:30:00Z', // Overlaps with first lesson
        endTime: '2025-01-15T11:30:00Z',
        notes: 'Conflicting lesson'
      }

      const createConflictingResponse = await fetch('http://localhost:3000/api/lessons', {
        method: 'POST',
        headers,
        body: JSON.stringify(conflictingLessonData)
      })
      expect(createConflictingResponse.status).toBe(400)

      // Create non-conflicting lesson
      const lesson2Data = {
        ...lesson1Data,
        date: '2025-01-15T14:00:00Z', // No conflict
        endTime: '2025-01-15T15:00:00Z',
        notes: 'Second lesson'
      }

      const createLesson2Response = await fetch('http://localhost:3000/api/lessons', {
        method: 'POST',
        headers,
        body: JSON.stringify(lesson2Data)
      })
      expect(createLesson2Response.status).toBe(201)
    })
  })

  describe('Payment Processing Flow', () => {
    it('should handle payment processing and lesson marking', async () => {
      const headers = testHelpers.createAuthHeaders(testData.user)

      // Create completed but unpaid lessons
      const lesson1 = await testHelpers.prisma.lesson.create({
        data: {
          date: new Date('2025-01-15T10:00:00Z'),
          endTime: new Date('2025-01-15T11:00:00Z'),
          studentId: testData.student.id,
          cost: 1500,
          isCompleted: true,
          isPaid: false,
          isCancelled: false,
          notes: 'Completed lesson 1',
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
          notes: 'Completed lesson 2',
          lessonType: 'individual',
          location: 'office'
        }
      })

      // Create payment for both lessons
      const paymentData = {
        studentId: testData.student.id,
        amount: 3000,
        date: new Date().toISOString(),
        description: 'Payment for two lessons',
        lessonIds: [lesson1.id, lesson2.id]
      }

      const createPaymentResponse = await fetch('http://localhost:3000/api/payments', {
        method: 'POST',
        headers,
        body: JSON.stringify(paymentData)
      })
      expect(createPaymentResponse.status).toBe(201)
      const payment = await createPaymentResponse.json()

      // Verify lessons are marked as paid
      const getLessonsResponse = await fetch('http://localhost:3000/api/lessons', { headers })
      expect(getLessonsResponse.status).toBe(200)
      const lessons = await getLessonsResponse.json()
      
      const paidLessons = lessons.filter(l => l.isPaid)
      expect(paidLessons.length).toBe(2)

      // Check financial statistics
      const getStatsResponse = await fetch('http://localhost:3000/api/finances/stats', { headers })
      expect(getStatsResponse.status).toBe(200)
      const stats = await getStatsResponse.json()
      
      expect(stats.totalRevenue).toBe(3000)
      expect(stats.completedLessons).toBe(2)
      expect(stats.totalDebt).toBe(0)
    })
  })

  describe('Lunch Break Management Flow', () => {
    it('should handle lunch break scheduling with conflict detection', async () => {
      const headers = testHelpers.createAuthHeaders(testData.user)

      // Create lunch break
      const lunchBreakData = {
        date: '2025-01-15T00:00:00Z',
        startTime: '2025-01-15T12:00:00Z',
        endTime: '2025-01-15T13:00:00Z'
      }

      const createLunchResponse = await fetch('http://localhost:3000/api/lunch-breaks', {
        method: 'POST',
        headers,
        body: JSON.stringify(lunchBreakData)
      })
      expect(createLunchResponse.status).toBe(200)

      // Try to create lesson during lunch break
      const conflictingLessonData = {
        date: '2025-01-15T12:30:00Z',
        endTime: '2025-01-15T13:30:00Z',
        studentId: testData.student.id,
        cost: 1500,
        notes: 'Lesson during lunch',
        lessonType: 'individual',
        location: 'office'
      }

      const createConflictingLessonResponse = await fetch('http://localhost:3000/api/lessons', {
        method: 'POST',
        headers,
        body: JSON.stringify(conflictingLessonData)
      })
      expect(createConflictingLessonResponse.status).toBe(400)

      // Create lesson outside lunch break
      const nonConflictingLessonData = {
        date: '2025-01-15T14:00:00Z',
        endTime: '2025-01-15T15:00:00Z',
        studentId: testData.student.id,
        cost: 1500,
        notes: 'Lesson after lunch',
        lessonType: 'individual',
        location: 'office'
      }

      const createNonConflictingLessonResponse = await fetch('http://localhost:3000/api/lessons', {
        method: 'POST',
        headers,
        body: JSON.stringify(nonConflictingLessonData)
      })
      expect(createNonConflictingLessonResponse.status).toBe(201)
    })
  })

  describe('Error Handling Flow', () => {
    it('should handle various error scenarios gracefully', async () => {
      const headers = testHelpers.createAuthHeaders(testData.user)

      // Test invalid student ID
      const invalidStudentResponse = await fetch('http://localhost:3000/api/students/99999', { headers })
      expect(invalidStudentResponse.status).toBe(404)

      // Test invalid lesson data
      const invalidLessonData = {
        studentId: testData.student.id
        // Missing required fields
      }
      const invalidLessonResponse = await fetch('http://localhost:3000/api/lessons', {
        method: 'POST',
        headers,
        body: JSON.stringify(invalidLessonData)
      })
      expect(invalidLessonResponse.status).toBe(400)

      // Test unauthorized access
      const unauthorizedResponse = await fetch('http://localhost:3000/api/students')
      expect(unauthorizedResponse.status).toBe(401)

      // Test forbidden access (user trying to access admin endpoint)
      const forbiddenResponse = await fetch('http://localhost:3000/api/admin/users', { headers })
      expect(forbiddenResponse.status).toBe(403)
    })
  })

  describe('Data Consistency Flow', () => {
    it('should maintain data consistency across operations', async () => {
      const headers = testHelpers.createAuthHeaders(testData.user)

      // Create student
      const studentData = {
        fullName: 'Consistency Test Student',
        phone: '+7 (999) 777-66-55',
        age: 5,
        parentName: 'Consistency Test Parent'
      }

      const createStudentResponse = await fetch('http://localhost:3000/api/students', {
        method: 'POST',
        headers,
        body: JSON.stringify(studentData)
      })
      const student = await createStudentResponse.json()

      // Create lesson
      const lessonData = {
        date: '2025-01-15T10:00:00Z',
        endTime: '2025-01-15T11:00:00Z',
        studentId: student.id,
        cost: 1500,
        notes: 'Consistency test lesson',
        lessonType: 'individual',
        location: 'office'
      }

      const createLessonResponse = await fetch('http://localhost:3000/api/lessons', {
        method: 'POST',
        headers,
        body: JSON.stringify(lessonData)
      })
      const lesson = await createLessonResponse.json()

      // Create payment
      const paymentData = {
        studentId: student.id,
        amount: 1500,
        date: new Date().toISOString(),
        description: 'Consistency test payment',
        lessonIds: [lesson.id]
      }

      const createPaymentResponse = await fetch('http://localhost:3000/api/payments', {
        method: 'POST',
        headers,
        body: JSON.stringify(paymentData)
      })
      expect(createPaymentResponse.status).toBe(201)

      // Verify data consistency
      const getStudentResponse = await fetch(`http://localhost:3000/api/students/${student.id}`, { headers })
      const studentWithLessons = await getStudentResponse.json()
      expect(studentWithLessons.lessons.length).toBe(1)

      const getStatsResponse = await fetch('http://localhost:3000/api/finances/stats', { headers })
      const stats = await getStatsResponse.json()
      expect(stats.totalRevenue).toBe(1500)

      // Delete student and verify cascade
      const deleteStudentResponse = await fetch(`http://localhost:3000/api/students/${student.id}`, {
        method: 'DELETE',
        headers
      })
      expect(deleteStudentResponse.status).toBe(200)

      // Verify lesson is also deleted
      const getLessonResponse = await fetch(`http://localhost:3000/api/lessons/${lesson.id}`, { headers })
      expect(getLessonResponse.status).toBe(404)
    })
  })
})
