export interface TeamMember {
  _id: string;
  name: string;
  avatar?: string;
  user?: {
    _id: string;
    name: string;
    avatar?: string;
    username?: string;
    email?: string;
  };
  email?: string;
  username?: string;
  role?: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "blocked" | "completed" | "done";
  priority?: "low" | "medium" | "high" | "critical";
  dueDate?: string;
  assignedTo?: string | undefined;
  assignedAt?: string;
  column: string;
  boardId?: string;
  position?: number;
  labels?: string[];
  completed?: boolean;
  isCompleted?: boolean;
}