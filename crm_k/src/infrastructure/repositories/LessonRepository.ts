import { PrismaClient } from '@prisma/client';
import { ILessonRepository } from '../../domain/repositories';
import { Lesson, CreateLessonData, UpdateLessonData, LessonWithStudent } from '../../domain/entities';

export class LessonRepository implements ILessonRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(userId?: number): Promise<LessonWithStudent[]> {
    const lessons = await this.prisma.lesson.findMany({
      where: userId ? { student: { userId } } : undefined,
      include: { student: true },
    });
    return lessons;
  }

  async findById(id: number): Promise<LessonWithStudent | null> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { student: true },
    });
    return lesson;
  }

  async create(data: CreateLessonData): Promise<Lesson> {
    const lesson = await this.prisma.lesson.create({
      data,
    });
    return lesson;
  }

  async update(data: UpdateLessonData): Promise<Lesson> {
    const { id, ...updateData } = data;
    const lesson = await this.prisma.lesson.update({
      where: { id },
      data: updateData,
    });
    return lesson;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.lesson.delete({
      where: { id },
    });
  }

  async findByStudentId(studentId: number): Promise<Lesson[]> {
    const lessons = await this.prisma.lesson.findMany({
      where: { studentId },
    });
    return lessons;
  }

  async findByDateRange(startDate: Date, endDate: Date, userId?: number): Promise<LessonWithStudent[]> {
    const lessons = await this.prisma.lesson.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        ...(userId && { student: { userId } }),
      },
      include: { student: true },
    });
    return lessons;
  }

  async findUnpaidLessons(userId?: number): Promise<LessonWithStudent[]> {
    const lessons = await this.prisma.lesson.findMany({
      where: {
        isPaid: false,
        isCancelled: false,
        ...(userId && { student: { userId } }),
      },
      include: { student: true },
    });
    return lessons;
  }
}
