export interface Task {
  _id: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'pending' | 'in-progress' | 'done' | 'blocked' | 'completed'; 
  boardId: string;
  column: string;
  position: number;  // Required, not optional
  dueDate?: string;
  assignedTo?: string;
  assignedAt?: string;
  labels?: string[];
  completed?: boolean;
  createdAt?: string;
  updatedAt?: string;
}