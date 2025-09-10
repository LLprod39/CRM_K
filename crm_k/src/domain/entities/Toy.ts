export interface Toy {
  id: number;
  name: string;
  description?: string;
  category?: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}
