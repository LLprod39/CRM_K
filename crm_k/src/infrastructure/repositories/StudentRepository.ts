import { PrismaClient } from '@prisma/client';
import { IStudentRepository } from '../../domain/repositories';
import { Student, CreateStudentData, UpdateStudentData } from '../../domain/entities';

export class StudentRepository implements IStudentRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(userId?: number): Promise<Student[]> {
    const students = await this.prisma.student.findMany({
      where: userId ? { userId } : undefined,
    });
    return students;
  }

  async findById(id: number): Promise<Student | null> {
    const student = await this.prisma.student.findUnique({
      where: { id },
    });
    return student;
  }

  async create(data: CreateStudentData): Promise<Student> {
    const student = await this.prisma.student.create({
      data,
    });
    return student;
  }

  async update(data: UpdateStudentData): Promise<Student> {
    const { id, ...updateData } = data;
    const student = await this.prisma.student.update({
      where: { id },
      data: updateData,
    });
    return student;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.student.delete({
      where: { id },
    });
  }

  async findByUserId(userId: number): Promise<Student[]> {
    const students = await this.prisma.student.findMany({
      where: { userId },
    });
    return students;
  }
}
