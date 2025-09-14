import { Lesson, CreateLessonData, UpdateLessonData, LessonWithStudent } from '../entities/Lesson';

export interface ILessonRepository {
  findAll(userId?: number): Promise<LessonWithStudent[]>;
  findById(id: number): Promise<LessonWithStudent | null>;
  create(data: CreateLessonData): Promise<Lesson>;
  update(data: UpdateLessonData): Promise<Lesson>;
  delete(id: number): Promise<void>;
  findByStudentId(studentId: number): Promise<Lesson[]>;
  findByDateRange(startDate: Date, endDate: Date, userId?: number): Promise<LessonWithStudent[]>;
  findUnpaidLessons(userId?: number): Promise<LessonWithStudent[]>;
}
