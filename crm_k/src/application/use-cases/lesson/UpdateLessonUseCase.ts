import { ILessonRepository } from '../../../domain/repositories';
import { Lesson, UpdateLessonData } from '../../../domain/entities';

export class UpdateLessonUseCase {
  constructor(private lessonRepository: ILessonRepository) {}

  async execute(data: UpdateLessonData): Promise<Lesson> {
    return this.lessonRepository.update(data);
  }
}
