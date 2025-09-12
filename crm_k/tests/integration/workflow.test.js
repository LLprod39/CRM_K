const { TestHelpers } = require('../utils/testHelpers')
const { createTestStudent, createTestLesson, createTestPayment, createTestLunchBreak } = require('../fixtures/testData')

describe('Complete Workflow Integration Tests', () => {
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

  describe('Complete Student Management Workflow', () => {
    it('should handle complete student lifecycle', async () => {
      const headers = testHelpers.createAuthHeaders(testData.user)

      // 1. Create a new student
      const studentData = createTestStudent('student2', testData.user.id)
      const createStudentResponse = await fetch('http://localhost:3000/api/students', {
        method: 'POST',
        headers,
        body: JSON.stringify(studentData)
      })
      expect(createStudentResponse.status).toBe(201)
      const newStudent = await createStudentResponse.json()

      // 2. Create lessons for the student
      const lesson1Data = createTestLesson('individual', newStudent.id)
      const createLesson1Response = await fetch('http://localhost:3000/api/lessons', {
        method: 'POST',
        headers,
        body: JSON.stringify(lesson1Data)
      })
      expect(createLesson1Response.status).toBe(201)
      const lesson1 = await createLesson1Response.json()

      const lesson2Data = createTestLesson('group', newStudent.id)
      const createLesson2Response = await fetch('http://localhost:3000/api/lessons', {
        method: 'POST',
        headers,
        body: JSON.stringify(lesson2Data)
      })
      expect(createLesson2Response.status).toBe(201)
      const lesson2 = await createLesson2Response.json()

      // 3. Mark lessons as completed
      const updateLesson1Response = await fetch(`http://localhost:3000/api/lessons/${lesson1.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ isCompleted: true, comment: 'Great lesson!' })
      })
      expect(updateLesson1Response.status).toBe(200)

      const updateLesson2Response = await fetch(`http://localhost:3000/api/lessons/${lesson2.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ isCompleted: true, comment: 'Good group work' })
      })
      expect(updateLesson2Response.status).toBe(200)

      // 4. Create payment for lessons
      const paymentData = {
        ...createTestPayment('payment1', newStudent.id),
        lessonIds: [lesson1.id, lesson2.id]
      }
      const createPaymentResponse = await fetch('http://localhost:3000/api/payments', {
        method: 'POST',
        headers,
        body: JSON.stringify(paymentData)
      })
      expect(createPaymentResponse.status).toBe(201)
      const payment = await createPaymentResponse.json()

      // 5. Verify lessons are marked as paid
      const getLessonsResponse = await fetch('http://localhost:3000/api/lessons', { headers })
      expect(getLessonsResponse.status).toBe(200)
      const lessons = await getLessonsResponse.json()
      
      const paidLessons = lessons.filter(l => l.isPaid)
      expect(paidLessons.length).toBe(2)

      // 6. Check financial statistics
      const getStatsResponse = await fetch('http://localhost:3000/api/finances/stats', { headers })
      expect(getStatsResponse.status).toBe(200)
      const stats = await getStatsResponse.json()
      
      expect(stats.completedLessons).toBe(2)
      expect(stats.totalRevenue).toBeGreaterThan(0)

      // 7. Update student information
      const updateStudentResponse = await fetch(`http://localhost:3000/api/students/${newStudent.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ 
          fullName: 'Updated Student Name',
          age: 6 
        })
      })
      expect(updateStudentResponse.status).toBe(200)
      const updatedStudent = await updateStudentResponse.json()
      expect(updatedStudent.fullName).toBe('Updated Student Name')
      expect(updatedStudent.age).toBe(6)

      // 8. Delete student (should cascade delete lessons and payments)
      const deleteStudentResponse = await fetch(`http://localhost:3000/api/students/${newStudent.id}`, {
        method: 'DELETE',
        headers
      })
      expect(deleteStudentResponse.status).toBe(200)

      // Verify cascade deletion
      const getLessonsAfterDeleteResponse = await fetch('http://localhost:3000/api/lessons', { headers })
      expect(getLessonsAfterDeleteResponse.status).toBe(200)
      const lessonsAfterDelete = await getLessonsAfterDeleteResponse.json()
      
      const studentLessons = lessonsAfterDelete.filter(l => l.studentId === newStudent.id)
      expect(studentLessons.length).toBe(0)
    })
  })

  describe('Schedule Management Workflow', () => {
    it('should handle complete schedule management', async () => {
      const headers = testHelpers.createAuthHeaders(testData.user)

      // 1. Create lunch break
      const lunchBreakData = createTestLunchBreak('lunch1', testData.user.id)
      const createLunchResponse = await fetch('http://localhost:3000/api/lunch-breaks', {
        method: 'POST',
        headers,
        body: JSON.stringify(lunchBreakData)
      })
      expect(createLunchResponse.status).toBe(200)
      const lunchBreak = await createLunchResponse.json()

      // 2. Create lesson that doesn't conflict with lunch break
      const lessonData = {
        ...createTestLesson('individual', testData.student.id),
        date: new Date('2025-01-15T10:00:00Z'), // Before lunch break
        endTime: new Date('2025-01-15T11:00:00Z')
      }
      const createLessonResponse = await fetch('http://localhost:3000/api/lessons', {
        method: 'POST',
        headers,
        body: JSON.stringify(lessonData)
      })
      expect(createLessonResponse.status).toBe(201)

      // 3. Try to create lesson that conflicts with lunch break
      const conflictingLessonData = {
        ...createTestLesson('individual', testData.student.id),
        date: new Date('2025-01-15T12:30:00Z'), // During lunch break
        endTime: new Date('2025-01-15T13:30:00Z')
      }
      const createConflictingLessonResponse = await fetch('http://localhost:3000/api/lessons', {
        method: 'POST',
        headers,
        body: JSON.stringify(conflictingLessonData)
      })
      expect(createConflictingLessonResponse.status).toBe(400)

      // 4. Update lunch break time
      const updateLunchData = {
        ...lunchBreakData,
        startTime: new Date('2025-01-15T13:00:00Z'),
        endTime: new Date('2025-01-15T14:00:00Z')
      }
      const updateLunchResponse = await fetch('http://localhost:3000/api/lunch-breaks', {
        method: 'POST',
        headers,
        body: JSON.stringify(updateLunchData)
      })
      expect(updateLunchResponse.status).toBe(200)

      // 5. Now create the previously conflicting lesson
      const createLessonAfterUpdateResponse = await fetch('http://localhost:3000/api/lessons', {
        method: 'POST',
        headers,
        body: JSON.stringify(conflictingLessonData)
      })
      expect(createLessonAfterUpdateResponse.status).toBe(201)

      // 6. Delete lunch break
      const date = testHelpers.createDateString(new Date(lunchBreakData.date))
      const deleteLunchResponse = await fetch(`http://localhost:3000/api/lunch-breaks?date=${date}`, {
        method: 'DELETE',
        headers
      })
      expect(deleteLunchResponse.status).toBe(200)
    })
  })

  describe('Financial Management Workflow', () => {
    it('should handle complete financial workflow', async () => {
      const headers = testHelpers.createAuthHeaders(testData.user)

      // 1. Create multiple lessons with different statuses
      const completedPaidLesson = await testHelpers.prisma.lesson.create({
        data: {
          ...createTestLesson('individual', testData.student.id),
          isCompleted: true,
          isPaid: true
        }
      })

      const completedUnpaidLesson = await testHelpers.prisma.lesson.create({
        data: {
          ...createTestLesson('group', testData.student.id),
          isCompleted: true,
          isPaid: false
        }
      })

      const prepaidLesson = await testHelpers.prisma.lesson.create({
        data: {
          ...createTestLesson('individual', testData.student.id),
          isCompleted: false,
          isPaid: true
        }
      })

      // 2. Create payment for unpaid lesson
      const paymentData = {
        ...createTestPayment('payment1', testData.student.id),
        lessonIds: [completedUnpaidLesson.id]
      }
      const createPaymentResponse = await fetch('http://localhost:3000/api/payments', {
        method: 'POST',
        headers,
        body: JSON.stringify(paymentData)
      })
      expect(createPaymentResponse.status).toBe(201)

      // 3. Check financial statistics
      const getStatsResponse = await fetch('http://localhost:3000/api/finances/stats', { headers })
      expect(getStatsResponse.status).toBe(200)
      const stats = await getStatsResponse.json()
      
      expect(stats.completedLessons).toBe(2)
      expect(stats.totalDebt).toBe(0) // All lessons should be paid now
      expect(stats.totalPrepaid).toBeGreaterThan(0)

      // 4. Check debts (should be empty)
      const getDebtsResponse = await fetch('http://localhost:3000/api/finances/debts', { headers })
      expect(getDebtsResponse.status).toBe(200)
      const debts = await getDebtsResponse.json()
      expect(debts.length).toBe(0)

      // 5. Check prepaid lessons
      const getPrepaidResponse = await fetch('http://localhost:3000/api/finances/prepaid', { headers })
      expect(getPrepaidResponse.status).toBe(200)
      const prepaidLessons = await getPrepaidResponse.json()
      expect(prepaidLessons.length).toBe(1)
      expect(prepaidLessons[0].id).toBe(prepaidLesson.id)

      // 6. Get student financial report
      const getStudentReportResponse = await fetch(`http://localhost:3000/api/finances/student/${testData.student.id}`, { headers })
      expect(getStudentReportResponse.status).toBe(200)
      const studentReport = await getStudentReportResponse.json()
      
      expect(studentReport.totalPaid).toBeGreaterThan(0)
      expect(studentReport.totalDebt).toBe(0)
      expect(studentReport.lessonsCompleted).toBe(2)
      expect(studentReport.lessonsPaid).toBe(2)

      // 7. Export financial data
      const exportResponse = await fetch('http://localhost:3000/api/finances/export', { headers })
      expect(exportResponse.status).toBe(200)
      expect(exportResponse.headers.get('content-type')).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    })
  })

  describe('Admin Management Workflow', () => {
    it('should handle complete admin workflow', async () => {
      const adminHeaders = testHelpers.createAuthHeaders(testData.admin)

      // 1. Create new user
      const newUserData = {
        email: 'newuser@test.com',
        password: 'password123',
        name: 'New User',
        role: 'USER'
      }
      const createUserResponse = await fetch('http://localhost:3000/api/admin/users', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify(newUserData)
      })
      expect(createUserResponse.status).toBe(201)
      const newUser = await createUserResponse.json()

      // 2. Get all users
      const getUsersResponse = await fetch('http://localhost:3000/api/admin/users', { headers: adminHeaders })
      expect(getUsersResponse.status).toBe(200)
      const users = await getUsersResponse.json()
      expect(users.length).toBeGreaterThan(1)

      // 3. Update user
      const updateUserResponse = await fetch(`http://localhost:3000/api/admin/users/${newUser.id}`, {
        method: 'PUT',
        headers: adminHeaders,
        body: JSON.stringify({ name: 'Updated User Name' })
      })
      expect(updateUserResponse.status).toBe(200)
      const updatedUser = await updateUserResponse.json()
      expect(updatedUser.name).toBe('Updated User Name')

      // 4. Get user statistics
      const getUserStatsResponse = await fetch(`http://localhost:3000/api/admin/users/${newUser.id}/stats`, { headers: adminHeaders })
      expect(getUserStatsResponse.status).toBe(200)
      const userStats = await getUserStatsResponse.json()
      
      expect(userStats.totalStudents).toBe(0) // New user has no students yet
      expect(userStats.totalLessons).toBe(0)
      expect(userStats.totalRevenue).toBe(0)

      // 5. Delete user
      const deleteUserResponse = await fetch(`http://localhost:3000/api/admin/users/${newUser.id}`, {
        method: 'DELETE',
        headers: adminHeaders
      })
      expect(deleteUserResponse.status).toBe(200)

      // 6. Verify user is deleted
      const getUsersAfterDeleteResponse = await fetch('http://localhost:3000/api/admin/users', { headers: adminHeaders })
      expect(getUsersAfterDeleteResponse.status).toBe(200)
      const usersAfterDelete = await getUsersAfterDeleteResponse.json()
      
      const deletedUser = usersAfterDelete.find(u => u.id === newUser.id)
      expect(deletedUser).toBeUndefined()
    })
  })

  describe('Cross-User Data Isolation', () => {
    it('should ensure data isolation between users', async () => {
      // Create second user
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

      const user1Headers = testHelpers.createAuthHeaders(testData.user)
      const user2Headers = testHelpers.createAuthHeaders(user2)

      // User 1 should not see User 2's students
      const user1StudentsResponse = await fetch('http://localhost:3000/api/students', { headers: user1Headers })
      expect(user1StudentsResponse.status).toBe(200)
      const user1Students = await user1StudentsResponse.json()
      expect(user1Students.length).toBe(1)
      expect(user1Students[0].id).toBe(testData.student.id)

      // User 2 should not see User 1's students
      const user2StudentsResponse = await fetch('http://localhost:3000/api/students', { headers: user2Headers })
      expect(user2StudentsResponse.status).toBe(200)
      const user2Students = await user2StudentsResponse.json()
      expect(user2Students.length).toBe(1)
      expect(user2Students[0].id).toBe(student2.id)

      // User 1 should not be able to access User 2's student
      const accessOtherStudentResponse = await fetch(`http://localhost:3000/api/students/${student2.id}`, { headers: user1Headers })
      expect(accessOtherStudentResponse.status).toBe(403)

      // User 2 should not be able to access User 1's student
      const accessOtherStudent2Response = await fetch(`http://localhost:3000/api/students/${testData.student.id}`, { headers: user2Headers })
      expect(accessOtherStudent2Response.status).toBe(403)

      // Admin should see all students
      const adminHeaders = testHelpers.createAuthHeaders(testData.admin)
      const adminStudentsResponse = await fetch('http://localhost:3000/api/students', { headers: adminHeaders })
      expect(adminStudentsResponse.status).toBe(200)
      const adminStudents = await adminStudentsResponse.json()
      expect(adminStudents.length).toBe(2)
    })
  })
})
