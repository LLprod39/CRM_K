import { ILessonRepository } from '../../../domain/repositories';
import { LessonWithStudent } from '../../../domain/entities';

export class GetLessonsUseCase {
  constructor(private lessonRepository: ILessonRepository) {}

  async execute(userId?: number): Promise<LessonWithStudent[]> {
    return this.lessonRepository.findAll(userId);
  }
}
