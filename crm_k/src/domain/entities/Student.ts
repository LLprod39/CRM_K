export interface Student {
  id: number;
  fullName: string;
  phone: string;
  age: number;
  parentName: string;
  diagnosis?: string;
  comment?: string;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStudentData {
  fullName: string;
  phone: string;
  age: number;
  parentName: string;
  diagnosis?: string;
  comment?: string;
}

export interface UpdateStudentData extends Partial<CreateStudentData> {
  id: number;
}
