export interface AISuggestion {
  id: number;
  studentId: number;
  title: string;
  duration: string;
  goals: string;
  materials: string;
  structure: string;
  recommendations: string;
  expectedResults: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
