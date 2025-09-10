import { Lesson, LessonStatus } from '../entities/Lesson';

export interface ILessonService {
  getLessonStatus(lesson: Lesson): LessonStatus;
  getLessonStatusText(status: LessonStatus): string;
  getCombinedLessonStatus(lesson: Lesson): string;
  autoUpdateLessonStatus(): Promise<void>;
  validateLessonData(data: unknown): boolean;
}
