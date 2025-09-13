// Основные типы для CRM системы
import { Student as PrismaStudent, Lesson as PrismaLesson, User as PrismaUser, UserRole as PrismaUserRole, Toy as PrismaToy } from '@prisma/client'

// Экспортируем типы из Prisma
export type Student = PrismaStudent
export type Lesson = PrismaLesson & { paymentStatus?: PaymentStatus }
export type User = PrismaUser
export type UserRole = PrismaUserRole
export type Toy = PrismaToy
export type PaymentStatus = 'PAID' | 'UNPAID' | 'PARTIAL'

// Типы для предложений ИИ
export interface AISuggestion {
  id: number;
  studentId: number;
  title: string;
  duration: string;
  goals: string;
  materials: string;
  structure: string;
  recommendations: string;
  expectedResults: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Типы для статусов уроков согласно новой логике
export type LessonStatus = 'scheduled' | 'prepaid' | 'cancelled' | 'completed' | 'debt' | 'unpaid'

// Утилиты для работы со статусами
export function getLessonStatus(lesson: Lesson): LessonStatus {
  if (lesson.isCancelled) return 'cancelled'
  if (lesson.isCompleted && lesson.isPaid) return 'completed' // Проведено + Оплачено = Оплачено (доход)
  if (lesson.isCompleted && !lesson.isPaid) return 'debt' // Проведено без оплаты = Задолженность
  if (!lesson.isCompleted && lesson.isPaid) return 'prepaid' // Предоплачено
  if (!lesson.isCompleted && !lesson.isPaid) return 'scheduled' // Запланировано
  return 'unpaid' // Не оплачено (резервный статус)
}

export function getLessonStatusText(status: LessonStatus): string {
  const statusMap = {
    scheduled: 'Запланировано',
    prepaid: 'Предоплачено',
    cancelled: 'Отменено',
    completed: 'Проведено',
    debt: 'Задолженность',
    unpaid: 'Не оплачено'
  }
  return statusMap[status] || 'Неизвестно'
}

export function getCombinedLessonStatus(lesson: Lesson): string {
  const statuses = []
  if (lesson.isCompleted) statuses.push('Проведено')
  if (lesson.isPaid) statuses.push('Оплачено')
  if (lesson.isCancelled) statuses.push('Отменено')
  
  if (statuses.length === 0) return 'Запланировано'
  return statuses.join(' + ')
}

// Утилиты для работы со статусами платежей абонементов
export function getPaymentStatusText(status: PaymentStatus): string {
  const statusMap = {
    PAID: 'Оплачено',
    UNPAID: 'Не оплачено',
    PARTIAL: 'Частично оплачено'
  }
  return statusMap[status] || 'Неизвестно'
}

export function getPaymentStatusDescription(status: PaymentStatus): string {
  const descriptions = {
    PAID: 'Оплачено - идет в предоплату ученика',
    UNPAID: 'Не оплачено - запланировано не оплачено',
    PARTIAL: 'Частично оплачено - оплачены только выбранные дни'
  }
  return descriptions[status] || 'Неизвестный статус'
}

// Тип для студента с пользователем
export type StudentWithUser = Student & {
  user?: User
}

// Тип для урока с включенным студентом
export type LessonWithStudent = Lesson & {
  student: StudentWithUser
}

// Тип для урока с опциональным студентом
export type LessonWithOptionalStudent = Lesson & {
  student?: StudentWithUser
  groupLessons?: LessonWithOptionalStudent[] // Для групповых занятий
}

// Тип для студента с включенными уроками
export type StudentWithLessons = Student & {
  lessons: Lesson[]
}

// Типы для создания и обновления данных
export interface CreateStudentData {
  fullName: string;
  phone: string;
  age: number;
  parentName: string;
  diagnosis?: string;
  comment?: string;
  photoUrl?: string;
  userId?: number; // ID пользователя (учителя) - для админов
}

export interface UpdateStudentData extends Partial<CreateStudentData> {
  id: number;
}

export interface CreateLessonData {
  date: Date;
  endTime: Date;
  studentId: number;
  studentIds?: number[]; // Для групповых занятий
  cost: number;
  isCompleted?: boolean;
  isPaid?: boolean; // deprecated, используйте paymentStatus
  paymentStatus?: PaymentStatus;
  isCancelled?: boolean;
  notes?: string;
  comment?: string;
  lessonType?: 'individual' | 'group';
  userId?: number; // ID пользователя (учителя) - для админов
}

export interface UpdateLessonData extends Partial<CreateLessonData> {
  id: number;
}

export interface FinancialStats {
  totalRevenue: number;
  weeklyRevenue: number;
  dailyRevenue: number;
  completedLessons: number;
  totalDebt: number;
  totalPrepaid: number;
  prepaidLessons: number;
  userRevenue: number; // Доход от пользователя (30% от оплаченных уроков)
  statusStats: Array<{
    status: LessonStatus;
    count: number;
    totalCost: number;
  }>;
}

export interface DebtInfo {
  student: Student;
  totalDebt: number;
  unpaidLessons: number;
  lastPaymentDate?: Date;
}

export interface PeriodStats {
  period: 'day' | 'week' | 'month' | 'year' | 'custom';
  startDate: Date;
  endDate: Date;
  revenue: number;
  lessonsCount: number;
}

export interface StudentFinancialReport {
  student: Student;
  totalPaid: number;
  totalDebt: number;
  lessonsCompleted: number;
  lessonsPaid: number;
  lastPaymentDate?: Date;
  paymentHistory: Array<{
    date: Date;
    amount: number;
    lessonId: number;
  }>;
}

// Типы для аутентификации
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthContextType {
  user: AuthUser | null;
  login: (data: LoginData) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

// Типы для платежей
export interface Payment {
  id: number;
  studentId: number;
  amount: number;
  date: Date;
  description?: string;
  lessonIds?: number[]; // ID уроков, за которые произведен платеж
  createdAt: Date;
  updatedAt: Date;
  student?: Student;
}

export interface CreatePaymentData {
  studentId: number;
  amount: number;
  date: Date;
  description?: string;
  lessonIds?: number[];
}

export interface PaymentFormData {
  studentId: number;
  amount: string;
  date: string;
  description: string;
  lessonIds: number[];
}

// Типы для админ панели
export interface UserStats {
  totalStudents: number;
  totalLessons: number;
  completedLessons: number;
  paidLessons: number;
  scheduledLessons: number;
  cancelledLessons: number;
  totalRevenue: number;
  totalDebt: number;
  totalPrepaid: number;
  lastActivity: number;
}

export interface UserWithStats extends User {
  stats: UserStats;
  students: Student[];
}

export interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalLessons: number;
  totalRevenue: number;
  recentUsers: User[];
  recentStudents: Student[];
  recentLessons: Lesson[];
  usersWithStats: UserWithStats[];
}

// Типы для гибких абонементов
export interface FlexibleSubscription {
  id: number;
  name: string;
  studentId: number;
  userId: number;
  startDate: Date;
  endDate: Date;
  totalCost: number;
  isPaid: boolean; // deprecated, используйте paymentStatus
  paymentStatus: PaymentStatus;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  student?: Student;
  user?: User;
  weekSchedules?: FlexibleSubscriptionWeek[];
  payments?: FlexibleSubscriptionPayment[];
  paidDays?: FlexibleSubscriptionPaidDay[];
}

export interface FlexibleSubscriptionWeek {
  id: number;
  subscriptionId: number;
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  subscription?: FlexibleSubscription;
  weekDays?: FlexibleSubscriptionDay[];
}

export interface FlexibleSubscriptionDay {
  id: number;
  weekId: number;
  dayOfWeek: number; // 0=воскресенье, 1=понедельник, ..., 6=суббота
  startTime: Date;
  endTime: Date;
  cost: number;
  location: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  week?: FlexibleSubscriptionWeek;
}

export interface FlexibleSubscriptionPayment {
  id: number;
  subscriptionId: number;
  amount: number;
  date: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  subscription?: FlexibleSubscription;
}

export interface FlexibleSubscriptionPaidDay {
  id: number;
  subscriptionId: number;
  dayId: number;
  isPaid: boolean;
  paymentAmount?: number;
  createdAt: Date;
  updatedAt: Date;
  subscription?: FlexibleSubscription;
  day?: FlexibleSubscriptionDay;
}

// Типы для создания гибкого абонемента
export interface CreateFlexibleSubscriptionData {
  name: string;
  studentId: number;
  userId: number;
  startDate: Date;
  endDate: Date;
  description?: string;
  paymentStatus: PaymentStatus;
  paidDayIds?: number[]; // ID дней, которые оплачены (для PARTIAL статуса)
  weekSchedules: CreateFlexibleSubscriptionWeekData[];
}

export interface CreateFlexibleSubscriptionWeekData {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  weekDays: CreateFlexibleSubscriptionDayData[];
}

export interface CreateFlexibleSubscriptionDayData {
  dayOfWeek: number;
  startTime: Date;
  endTime: Date;
  cost: number;
  location?: string;
  notes?: string;
}

// Типы для формы создания гибкого абонемента
export interface FlexibleSubscriptionFormData {
  name: string;
  studentId: number;
  userId: number;
  startDate: string;
  endDate: string;
  description: string;
  paymentStatus: PaymentStatus;
  paidDayIds: number[]; // ID дней, которые оплачены (для PARTIAL статуса)
  weekSchedules: FlexibleSubscriptionWeekFormData[];
}

export interface FlexibleSubscriptionWeekFormData {
  weekNumber: number;
  startDate: string;
  endDate: string;
  weekDays: FlexibleSubscriptionDayFormData[];
}

export interface FlexibleSubscriptionDayFormData {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  cost: string;
  location: string;
  notes: string;
}

// Тип для гибкого абонемента с полными данными
export type FlexibleSubscriptionWithDetails = FlexibleSubscription & {
  student: StudentWithUser;
  user: User;
  weekSchedules: (FlexibleSubscriptionWeek & {
    weekDays: FlexibleSubscriptionDay[];
  })[];
  payments: FlexibleSubscriptionPayment[];
}