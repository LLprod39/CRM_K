import { Student, CreateStudentData, UpdateStudentData } from '../entities/Student';

export interface IStudentRepository {
  findAll(userId?: number): Promise<Student[]>;
  findById(id: number): Promise<Student | null>;
  create(data: CreateStudentData): Promise<Student>;
  update(data: UpdateStudentData): Promise<Student>;
  delete(id: number): Promise<void>;
  findByUserId(userId: number): Promise<Student[]>;
}
