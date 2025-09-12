export interface Lesson {
  id: number;
  date: Date;
  endTime: Date;
  studentId: number;
  cost: number;
  isCompleted: boolean;
  isPaid: boolean;
  isCancelled: boolean;
  notes?: string;
  lessonType: 'individual' | 'group';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLessonData {
  date: Date;
  endTime: Date;
  studentId: number;
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

export type LessonStatus = 'scheduled' | 'completed' | 'paid' | 'cancelled' | 'prepaid' | 'unpaid';

export interface LessonWithStudent extends Lesson {
  student: any; // Student type will be imported from types
}

export interface LessonWithOptionalStudent extends Lesson {
  student?: any; // Student type will be imported from types
}
