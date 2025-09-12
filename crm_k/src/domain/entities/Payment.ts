export interface Payment {
  id: number;
  studentId: number;
  amount: number;
  date: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
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
