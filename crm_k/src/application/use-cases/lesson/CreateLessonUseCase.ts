import { ILessonRepository } from '../../../domain/repositories';
import { Lesson, CreateLessonData } from '../../../domain/entities';

export class CreateLessonUseCase {
  constructor(private lessonRepository: ILessonRepository) {}

  async execute(data: CreateLessonData): Promise<Lesson> {
    return this.lessonRepository.create(data);
  }
}
