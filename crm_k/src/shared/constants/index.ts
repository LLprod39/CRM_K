export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
  },
  STUDENTS: {
    BASE: '/api/students',
    BY_ID: (id: number) => `/api/students/${id}`,
  },
  LESSONS: {
    BASE: '/api/lessons',
    BY_ID: (id: number) => `/api/lessons/${id}`,
    AUTO_UPDATE: '/api/lessons/auto-update-status',
  },
  PAYMENTS: {
    BASE: '/api/payments',
    UNPAID_LESSONS: '/api/payments/unpaid-lessons',
  },
  FINANCES: {
    STATS: '/api/finances/stats',
    CHART: '/api/finances/chart',
    DEBTS: '/api/finances/debts',
    EXPORT: '/api/finances/export',
    PERIOD: '/api/finances/period',
    STUDENT: (id: number) => `/api/finances/students/${id}`,
  },
  ADMIN: {
    STATS: '/api/admin/stats',
    USERS: {
      BASE: '/api/admin/users',
      BY_ID: (id: number) => `/api/admin/users/${id}`,
    },
    TOYS: {
      BASE: '/api/admin/toys',
      BY_ID: (id: number) => `/api/admin/toys/${id}`,
    },
  },
  AI: {
    SUGGESTIONS: {
      BASE: '/api/ai/suggestions',
      BY_STUDENT: (studentId: number) => `/api/ai/suggestions/${studentId}`,
      LESSON: '/api/ai/lesson-suggestions',
    },
  },
} as const;

export const LESSON_STATUS = {
  SCHEDULED: 'scheduled',
  PREPAID: 'prepaid',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  DEBT: 'debt',
  UNPAID: 'unpaid',
} as const;

export const LESSON_TYPES = {
  INDIVIDUAL: 'individual',
  GROUP: 'group',
} as const;


export const USER_ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;
