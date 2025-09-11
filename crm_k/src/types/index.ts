// Основные типы для CRM системы
import { Student as PrismaStudent, Lesson as PrismaLesson, User as PrismaUser, UserRole as PrismaUserRole, Toy as PrismaToy } from '@prisma/client'

// Экспортируем типы из Prisma
export type Student = PrismaStudent
export type Lesson = PrismaLesson
export type User = PrismaUser
export type UserRole = PrismaUserRole
export type Toy = PrismaToy

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

// Типы для статусов уроков (теперь используем булевые поля)
export type LessonStatus = 'scheduled' | 'completed' | 'paid' | 'cancelled' | 'prepaid' | 'unpaid'

// Утилиты для работы со статусами
export function getLessonStatus(lesson: Lesson): LessonStatus {
  if (lesson.isCancelled) return 'cancelled'
  if (lesson.isCompleted && lesson.isPaid) return 'paid'
  if (lesson.isCompleted && !lesson.isPaid) return 'completed'
  if (!lesson.isCompleted && lesson.isPaid) return 'prepaid'
  if (!lesson.isCompleted && !lesson.isPaid) return 'scheduled'
  return 'unpaid'
}

export function getLessonStatusText(status: LessonStatus): string {
  const statusMap = {
    scheduled: 'Запланировано',
    completed: 'Проведено',
    paid: 'Оплачено',
    cancelled: 'Отменено',
    prepaid: 'Предоплачено',
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

// Тип для урока с включенным студентом
export type LessonWithStudent = Lesson & {
  student: Student
}

// Тип для урока с опциональным студентом
export type LessonWithOptionalStudent = Lesson & {
  student?: Student
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
  isPaid?: boolean;
  isCancelled?: boolean;
  notes?: string;
  lessonType?: 'individual' | 'group';
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