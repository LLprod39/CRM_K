const { PrismaClient } = require('@prisma/client')
const { checkLessonConflicts, checkSlotAvailability, releaseSlot } = require('../../src/lib/lessonConflictUtils')

const prisma = new PrismaClient()

describe('Lesson Conflict Utils', () => {
  let testData

  beforeAll(async () => {
    // Создаем тестовые данные
    testData = {
      teachers: [],
      students: [],
      lessons: []
    }

    // Создаем учителей
    for (let i = 1; i <= 3; i++) {
      const teacher = await prisma.user.create({
        data: {
          email: `teacher${i}@test.com`,
          password: 'password',
          name: `Учитель ${i}`,
          role: 'USER'
        }
      })
      testData.teachers.push(teacher)
    }

    // Создаем учеников
    for (let i = 1; i <= 5; i++) {
      const student = await prisma.student.create({
        data: {
          fullName: `Ученик ${i}`,
          phone: `+7-900-000-000${i}`,
          age: 5 + i,
          parentName: `Родитель ${i}`,
          userId: testData.teachers[0].id, // Назначаем первого учителя
          isAssigned: true
        }
      })
      testData.students.push(student)
    }
  })

  afterAll(async () => {
    // Очищаем тестовые данные
    await prisma.lesson.deleteMany({})
    await prisma.student.deleteMany({})
    await prisma.user.deleteMany({})
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Очищаем занятия перед каждым тестом
    await prisma.lesson.deleteMany({})
  })

  describe('checkLessonConflicts', () => {
    it('should allow creating individual lesson when no conflicts', async () => {
      const lessonDate = new Date('2024-01-15T10:00:00Z')
      const lessonEndTime = new Date('2024-01-15T11:00:00Z')

      const result = await checkLessonConflicts({
        date: lessonDate,
        endTime: lessonEndTime,
        teacherId: testData.teachers[0].id,
        studentIds: [testData.students[0].id],
        lessonType: 'individual'
      })

      expect(result.hasConflict).toBe(false)
      expect(result.canCreate).toBe(true)
      expect(result.conflicts).toHaveLength(0)
    })

    it('should prevent more than 2 teachers working simultaneously', async () => {
      const lessonDate = new Date('2024-01-15T10:00:00Z')
      const lessonEndTime = new Date('2024-01-15T11:00:00Z')

      // Создаем занятия для двух учителей в одно время
      await prisma.lesson.createMany({
        data: [
          {
            date: lessonDate,
            endTime: lessonEndTime,
            studentId: testData.students[0].id,
            teacherId: testData.teachers[0].id,
            cost: 1000,
            lessonType: 'individual'
          },
          {
            date: lessonDate,
            endTime: lessonEndTime,
            studentId: testData.students[1].id,
            teacherId: testData.teachers[1].id,
            cost: 1000,
            lessonType: 'individual'
          }
        ]
      })

      // Пытаемся создать занятие для третьего учителя в то же время
      const result = await checkLessonConflicts({
        date: lessonDate,
        endTime: lessonEndTime,
        teacherId: testData.teachers[2].id,
        studentIds: [testData.students[2].id],
        lessonType: 'individual'
      })

      expect(result.hasConflict).toBe(true)
      expect(result.canCreate).toBe(false)
      expect(result.conflicts.length).toBeGreaterThan(0)
      expect(result.conflicts[0]).toContain('В это время уже заняты')
    })

    it('should limit group lessons to maximum 2 students per teacher', async () => {
      const lessonDate = new Date('2024-01-15T10:00:00Z')
      const lessonEndTime = new Date('2024-01-15T11:00:00Z')

      // Создаем групповое занятие с 2 учениками
      await prisma.lesson.createMany({
        data: [
          {
            date: lessonDate,
            endTime: lessonEndTime,
            studentId: testData.students[0].id,
            teacherId: testData.teachers[0].id,
            cost: 1000,
            lessonType: 'group'
          },
          {
            date: lessonDate,
            endTime: lessonEndTime,
            studentId: testData.students[1].id,
            teacherId: testData.teachers[0].id,
            cost: 1000,
            lessonType: 'group'
          }
        ]
      })

      // Пытаемся создать еще одно групповое занятие с тем же учителем
      const result = await checkLessonConflicts({
        date: lessonDate,
        endTime: lessonEndTime,
        teacherId: testData.teachers[0].id,
        studentIds: [testData.students[2].id],
        lessonType: 'group'
      })

      expect(result.hasConflict).toBe(true)
      expect(result.canCreate).toBe(false)
      expect(result.conflicts[0]).toContain('У учителя уже есть групповые занятия')
    })

    // Тест конфликтов пользователей временно отключен
    // it('should prevent user conflicts (same time for same user students)', async () => {
    //   // Этот тест требует дополнительной настройки данных
    // })

    it('should allow updating existing lesson without conflicts', async () => {
      const lessonDate = new Date('2024-01-15T10:00:00Z')
      const lessonEndTime = new Date('2024-01-15T11:00:00Z')

      // Создаем занятие
      const lesson = await prisma.lesson.create({
        data: {
          date: lessonDate,
          endTime: lessonEndTime,
          studentId: testData.students[0].id,
          teacherId: testData.teachers[0].id,
          cost: 1000,
          lessonType: 'individual'
        }
      })

      // Обновляем то же занятие (исключаем его из проверки)
      const result = await checkLessonConflicts({
        date: lessonDate,
        endTime: lessonEndTime,
        teacherId: testData.teachers[0].id,
        studentIds: [testData.students[0].id],
        lessonType: 'individual',
        excludeLessonId: lesson.id
      })

      expect(result.hasConflict).toBe(false)
      expect(result.canCreate).toBe(true)
    })
  })

  describe('checkSlotAvailability', () => {
    it('should return available slot when no lunch breaks', async () => {
      const lessonDate = new Date('2024-01-15T10:00:00Z')
      const lessonEndTime = new Date('2024-01-15T11:00:00Z')

      const result = await checkSlotAvailability(
        testData.teachers[0].id,
        lessonDate,
        lessonEndTime
      )

      expect(result.isAvailable).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should return unavailable slot when conflicts with lunch break', async () => {
      const lessonDate = new Date('2024-01-15T10:00:00Z')
      const lessonEndTime = new Date('2024-01-15T11:00:00Z')

      // Создаем обеденный перерыв
      await prisma.lunchBreak.create({
        data: {
          date: lessonDate,
          startTime: new Date('2024-01-15T10:30:00Z'),
          endTime: new Date('2024-01-15T11:30:00Z'),
          userId: testData.teachers[0].id
        }
      })

      const result = await checkSlotAvailability(
        testData.teachers[0].id,
        lessonDate,
        lessonEndTime
      )

      expect(result.isAvailable).toBe(false)
      expect(result.reason).toContain('обеденным перерывом')
    })
  })

  describe('releaseSlot', () => {
    it('should log slot release', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const lessonDate = new Date('2024-01-15T10:00:00Z')
      const lessonEndTime = new Date('2024-01-15T11:00:00Z')

      await releaseSlot(testData.teachers[0].id, lessonDate, lessonEndTime)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Слот освобожден для учителя')
      )

      consoleSpy.mockRestore()
    })
  })
})
