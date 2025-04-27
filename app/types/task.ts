/* eslint-disable @typescript-eslint/no-explicit-any */
// Define all possible status values across the application
export type TaskStatus = 
  | "todo" 
  | "in-progress" 
  | "blocked" 
  | "completed" 
  | "done"
  | "pending";

// Define all possible priority values
export type TaskPriority = "low" | "medium" | "high" | "critical";

// Define the AssignedUser interface for better typing
export interface AssignedUser {
  _id: string;
  name: string;
  avatar?: string;
}

// Type guard to check if assignedTo is an AssignedUser
export function isAssignedUser(value: any): value is AssignedUser {
  return typeof value === 'object' && value !== null && '_id' in value && 'name' in value;
}

// Helper function to extract user ID from assignedTo property
export function getUserIdFromAssignedTo(assignedTo?: string | AssignedUser): string | undefined {
  if (!assignedTo) return undefined;
  if (typeof assignedTo === 'string') return assignedTo;
  return assignedTo._id;
}

// Base Task interface with all possible fields
export interface Task {
  _id: string;
  title: string;
  status?: string;
  priority?: string;
  description?: string;
  dueDate?: string;
  assignedTo?: string | {
    _id: string;
    name?: string;
    username?: string;
    email?: string;
    avatar?: string;
  } | null;
  assignedAt?: string;
  column: string;
  boardId?: string;
  position?: number;
  labels?: string[];
  completed?: boolean;
  isCompleted?: boolean;
  deleted?: boolean;
}

// Helper type guard
export function isTaskCompleted(task: Task): boolean {
  if (!task) return false;
  return (
    task.status === 'done' ||
    task.status === 'completed' || 
    task.completed === true ||
    task.isCompleted === true
  );
}

// Helper function to normalize task status
export function normalizeTaskStatus(status?: string): TaskStatus {
  if (!status) return 'pending';
  if (status === 'completed') return 'done';
  if (status === 'done') return 'done';
  return status as TaskStatus;
}