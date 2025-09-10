export interface LessonDTO {
  id: number;
  date: string;
  endTime: string;
  studentId: number;
  cost: number;
  isCompleted: boolean;
  isPaid: boolean;
  isCancelled: boolean;
  notes?: string;
  lessonType: 'individual' | 'group';
  location: 'office' | 'online' | 'home';
  createdAt: string;
  updatedAt: string;
}

export interface CreateLessonDTO {
  date: string;
  endTime: string;
  studentId: number;
  cost: number;
  isCompleted?: boolean;
  isPaid?: boolean;
  isCancelled?: boolean;
  notes?: string;
  lessonType?: 'individual' | 'group';
  location?: 'office' | 'online' | 'home';
}

export interface UpdateLessonDTO extends Partial<CreateLessonDTO> {
  id: number;
}
