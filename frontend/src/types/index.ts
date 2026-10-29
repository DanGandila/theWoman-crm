export type Role = 'ADMIN' | 'MANAGER' | 'MEMBER';

export type ProjectStatus = 'TODO' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description?: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  responsibleId?: string | null;
  responsible?: { id: string; name: string } | null;
  _count?: { tasks: number };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: string;
  projectId: string;
  project?: Pick<Project, 'id' | 'name' | 'key'>;
  assignees: Pick<User, 'id' | 'name' | 'avatarUrl'>[];
  reporterId?: string | null;
  reporter?: Pick<User, 'id' | 'name' | 'avatarUrl'> | null;
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  MEMBER: 'Member',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  ON_HOLD: 'On hold',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  IN_REVIEW: 'In review',
  DONE: 'Done',
  CANCELLED: 'Cancelled',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};
