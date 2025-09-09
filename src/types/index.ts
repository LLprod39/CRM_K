// Основные типы для CRM системы

export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  age: number;
  diagnosis?: string;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
  lessons?: Lesson[];
}

export interface Lesson {
  id: number;
  date: Date;
  time: string;
  studentId: number;
  student?: Student;
  cost: number;
  status: LessonStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum LessonStatus {
  SCHEDULED = 'SCHEDULED',   // Запланировано
  COMPLETED = 'COMPLETED',   // Проведено
  CANCELLED = 'CANCELLED',   // Отменено
  PAID = 'PAID'             // Оплачено
}

export interface CreateStudentData {
  firstName: string;
  lastName: string;
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
  time: string;
  studentId: number;
  cost: number;
  status?: LessonStatus;
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
  }>;
}
