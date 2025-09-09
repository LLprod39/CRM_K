// Основные типы для CRM системы
import { Student as PrismaStudent, Lesson as PrismaLesson, LessonStatus as PrismaLessonStatus, User as PrismaUser, UserRole as PrismaUserRole } from '@prisma/client'

// Экспортируем типы из Prisma
export type Student = PrismaStudent
export type Lesson = PrismaLesson
export type LessonStatus = PrismaLessonStatus
export type User = PrismaUser
export type UserRole = PrismaUserRole

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
  diagnosis?: string;
  comment?: string;
}

export interface UpdateStudentData extends Partial<CreateStudentData> {
  id: number;
}

export interface CreateLessonData {
  date: Date;
  studentId: number;
  cost: number;
  status?: LessonStatus;
  notes?: string;
}

export interface UpdateLessonData extends Partial<CreateLessonData> {
  id: number;
}

export interface FinancialStats {
  totalRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  dailyRevenue: number;
  completedLessons: number;
  totalDebt: number;
  topStudents: Array<{
    student: Student;
    totalPaid: number;
    lessonsCount: number;
  }>;
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
  averageCheck: number;
}

export interface StudentFinancialReport {
  student: Student;
  totalPaid: number;
  totalDebt: number;
  lessonsCompleted: number;
  lessonsPaid: number;
  averageCheck: number;
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