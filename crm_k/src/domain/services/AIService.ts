import { AISuggestion } from '../entities/AISuggestion';

export interface IAIService {
  generateLessonSuggestions(studentId: number): Promise<AISuggestion>;
  getSuggestionsForStudent(studentId: number): Promise<AISuggestion[]>;
  createSuggestion(data: Omit<AISuggestion, 'id' | 'createdAt' | 'updatedAt'>): Promise<AISuggestion>;
}
