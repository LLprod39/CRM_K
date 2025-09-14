// Test data fixtures
const testData = {
  users: {
    admin: {
      email: 'admin@test.com',
      password: 'admin123',
      name: 'Test Admin',
      role: 'ADMIN'
    },
    user: {
      email: 'user@test.com',
      password: 'user123',
      name: 'Test User',
      role: 'USER'
    },
    user2: {
      email: 'user2@test.com',
      password: 'user123',
      name: 'Test User 2',
      role: 'USER'
    }
  },

  students: {
    student1: {
      fullName: 'Александр Петров',
      phone: '+7 (999) 111-11-11',
      age: 5,
      parentName: 'Владимир Петрович',
      diagnosis: 'ДЦП',
      comment: 'Тестовый студент 1'
    },
    student2: {
      fullName: 'Мария Иванова',
      phone: '+7 (999) 222-22-22',
      age: 6,
      parentName: 'Анна Сергеевна',
      diagnosis: 'РАС',
      comment: 'Тестовый студент 2'
    },
    student3: {
      fullName: 'Дмитрий Сидоров',
      phone: '+7 (999) 333-33-33',
      age: 4,
      parentName: 'Елена Владимировна',
      diagnosis: 'Синдром Дауна',
      comment: 'Тестовый студент 3'
    }
  },

  lessons: {
    individual: {
      date: '2025-01-15T10:00:00Z',
      endTime: '2025-01-15T11:00:00Z',
      cost: 1500,
      isCompleted: false,
      isPaid: false,
      isCancelled: false,
      notes: 'Индивидуальное занятие',
      lessonType: 'individual',
      location: 'office'
    },
    group: {
      date: '2025-01-15T14:00:00Z',
      endTime: '2025-01-15T15:00:00Z',
      cost: 1000,
      isCompleted: false,
      isPaid: false,
      isCancelled: false,
      notes: 'Групповое занятие',
      lessonType: 'group',
      location: 'office'
    },
    online: {
      date: '2025-01-15T16:00:00Z',
      endTime: '2025-01-15T17:00:00Z',
      cost: 1200,
      isCompleted: false,
      isPaid: false,
      isCancelled: false,
      notes: 'Онлайн занятие',
      lessonType: 'individual',
      location: 'online'
    }
  },

  payments: {
    payment1: {
      amount: 3000,
      date: '2025-01-10T00:00:00Z',
      description: 'Оплата за январь'
    },
    payment2: {
      amount: 1500,
      date: '2025-01-12T00:00:00Z',
      description: 'Частичная оплата'
    },
    payment3: {
      amount: 5000,
      date: '2025-01-05T00:00:00Z',
      description: 'Предоплата за месяц'
    }
  },

  lunchBreaks: {
    lunch1: {
      date: '2025-01-15T00:00:00Z',
      startTime: '2025-01-15T12:00:00Z',
      endTime: '2025-01-15T13:00:00Z'
    },
    lunch2: {
      date: '2025-01-16T00:00:00Z',
      startTime: '2025-01-16T12:30:00Z',
      endTime: '2025-01-16T13:30:00Z'
    }
  },

  toys: {
    toy1: {
      name: 'Конструктор LEGO',
      description: 'Развивающий конструктор',
      category: 'Развивающие',
      isAvailable: true
    },
    toy2: {
      name: 'Пазл 100 деталей',
      description: 'Деревянный пазл',
      category: 'Сенсорные',
      isAvailable: true
    },
    toy3: {
      name: 'Мяч для фитбола',
      description: 'Большой мяч для упражнений',
      category: 'Моторные',
      isAvailable: false
    }
  },

  aiSuggestions: {
    suggestion1: {
      title: 'Развитие мелкой моторики',
      duration: '45 минут',
      goals: JSON.stringify(['Развитие координации', 'Улучшение хвата']),
      materials: JSON.stringify(['Пластилин', 'Бусины', 'Шнурки']),
      structure: JSON.stringify(['Разминка', 'Основная часть', 'Заключение']),
      recommendations: JSON.stringify(['Повторять ежедневно', 'Увеличивать сложность']),
      expectedResults: JSON.stringify(['Улучшение координации', 'Развитие терпения']),
      notes: 'Подходит для детей с ДЦП'
    }
  }
}

// Helper functions for test data
const createTestUser = (type = 'user', overrides = {}) => ({
  ...testData.users[type],
  ...overrides
})

const createTestStudent = (type = 'student1', userId, overrides = {}) => ({
  ...testData.students[type],
  userId,
  ...overrides
})

const createTestLesson = (type = 'individual', studentId, overrides = {}) => ({
  ...testData.lessons[type],
  studentId,
  ...overrides
})

const createTestPayment = (type = 'payment1', studentId, overrides = {}) => ({
  ...testData.payments[type],
  studentId,
  ...overrides
})

const createTestLunchBreak = (type = 'lunch1', userId, overrides = {}) => ({
  ...testData.lunchBreaks[type],
  userId,
  ...overrides
})

const createTestToy = (type = 'toy1', overrides = {}) => ({
  ...testData.toys[type],
  ...overrides
})

const createTestAISuggestion = (type = 'suggestion1', studentId, overrides = {}) => ({
  ...testData.aiSuggestions[type],
  studentId,
  ...overrides
})

module.exports = {
  testData,
  createTestUser,
  createTestStudent,
  createTestLesson,
  createTestPayment,
  createTestLunchBreak,
  createTestToy,
  createTestAISuggestion
}
