import { Payment, CreatePaymentData } from '../entities/Payment';

export interface IPaymentRepository {
  findAll(userId?: number): Promise<Payment[]>;
  findById(id: number): Promise<Payment | null>;
  create(data: CreatePaymentData): Promise<Payment>;
  update(id: number, data: Partial<Payment>): Promise<Payment>;
  delete(id: number): Promise<void>;
  findByStudentId(studentId: number): Promise<Payment[]>;
  findByDateRange(startDate: Date, endDate: Date, userId?: number): Promise<Payment[]>;
}
