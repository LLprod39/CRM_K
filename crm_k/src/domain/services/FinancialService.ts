import { Lesson, Student, Payment } from '../entities';

export interface FinancialStats {
  totalRevenue: number;
  weeklyRevenue: number;
  dailyRevenue: number;
  completedLessons: number;
  totalDebt: number;
  totalPrepaid: number;
  prepaidLessons: number;
  userRevenue: number;
  statusStats: Array<{
    status: string;
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

export interface IFinancialService {
  calculateStats(userId?: number): Promise<FinancialStats>;
  getDebts(userId?: number): Promise<DebtInfo[]>;
  getPeriodStats(period: string, startDate?: Date, endDate?: Date, userId?: number): Promise<PeriodStats>;
  getStudentFinancialReport(studentId: number): Promise<StudentFinancialReport>;
  exportFinancialData(startDate: Date, endDate: Date, userId?: number): Promise<unknown>;
}
