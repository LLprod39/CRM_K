const { getLessonStatus, getLessonStatusText, getCombinedLessonStatus } = require('../../src/types')

describe('Lesson Status Utils', () => {
  describe('getLessonStatus', () => {
    it('should return cancelled for cancelled lesson', () => {
      const lesson = {
        isCancelled: true,
        isCompleted: false,
        isPaid: false
      }
      
      const status = getLessonStatus(lesson)
      expect(status).toBe('cancelled')
    })

    it('should return paid for completed and paid lesson', () => {
      const lesson = {
        isCancelled: false,
        isCompleted: true,
        isPaid: true
      }
      
      const status = getLessonStatus(lesson)
      expect(status).toBe('paid')
    })

    it('should return completed for completed but unpaid lesson', () => {
      const lesson = {
        isCancelled: false,
        isCompleted: true,
        isPaid: false
      }
      
      const status = getLessonStatus(lesson)
      expect(status).toBe('completed')
    })

    it('should return prepaid for paid but not completed lesson', () => {
      const lesson = {
        isCancelled: false,
        isCompleted: false,
        isPaid: true
      }
      
      const status = getLessonStatus(lesson)
      expect(status).toBe('prepaid')
    })

    it('should return scheduled for not completed and not paid lesson', () => {
      const lesson = {
        isCancelled: false,
        isCompleted: false,
        isPaid: false
      }
      
      const status = getLessonStatus(lesson)
      expect(status).toBe('scheduled')
    })
  })

  describe('getLessonStatusText', () => {
    it('should return correct text for each status', () => {
      expect(getLessonStatusText('scheduled')).toBe('Запланировано')
      expect(getLessonStatusText('completed')).toBe('Проведено')
      expect(getLessonStatusText('paid')).toBe('Оплачено')
      expect(getLessonStatusText('cancelled')).toBe('Отменено')
      expect(getLessonStatusText('prepaid')).toBe('Предоплачено')
      expect(getLessonStatusText('unpaid')).toBe('Не оплачено')
    })

    it('should return unknown for invalid status', () => {
      const text = getLessonStatusText('invalid')
      expect(text).toBe('Неизвестно')
    })
  })

  describe('getCombinedLessonStatus', () => {
    it('should return scheduled for lesson with no flags', () => {
      const lesson = {
        isCompleted: false,
        isPaid: false,
        isCancelled: false
      }
      
      const status = getCombinedLessonStatus(lesson)
      expect(status).toBe('Запланировано')
    })

    it('should return combined status for multiple flags', () => {
      const lesson = {
        isCompleted: true,
        isPaid: true,
        isCancelled: false
      }
      
      const status = getCombinedLessonStatus(lesson)
      expect(status).toBe('Проведено + Оплачено')
    })

    it('should return cancelled status', () => {
      const lesson = {
        isCompleted: false,
        isPaid: false,
        isCancelled: true
      }
      
      const status = getCombinedLessonStatus(lesson)
      expect(status).toBe('Отменено')
    })
  })
})
