export interface Comment {
  id: string;
  user: string;
  text: string;
  timestamp: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface TaskFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface Task {
  id: string;
  title: string;
  status: 'inbox' | 'todo' | 'doing' | 'done';
  time?: string; // e.g., "14:00" or "YYYY-MM-DD|YYYY-MM-DD"
  color?: string;
  tags?: Tag[];
  description?: string;
  comments?: Comment[];
  files?: TaskFile[]; // Array of attached files
  x?: number;
  y?: number;
  boardId?: string;
  taskType?: number; // 0: Work, 1: Memo, 2: File/Folder
  project?: string;
  dueTime?: string;
}

export type ViewMode = 'dashboard' | 'inbox' | 'planner' | 'board' | 'calendar' | 'timeline' | 'profile' | 'settings';

export interface Column {
  id: string;
  title: string;
  status: Task['status'];
}

export interface Connection {
  id: string;
  from: string | number;
  to: string | number;
  shape?: 'bezier' | 'straight';
  style?: 'solid' | 'dashed';
  boardId?: string;
}

export interface Group {
    id: string;
    title: string;
    x: number;
    y: number;
    width: number;
    height: number;
    boardId?: string;
}

export interface Board {
    id: string;
    title: string;
}

// Auth & Workspace Types
export interface User {
  id: number;
  email: string;
  name: string;
  is_student_verified?: boolean;
}

export interface AuthUser {
  email: string;
  name: string;
}

export interface Member {
  id: number;
  name: string;
  email: string;
  isOnline: boolean;
  role: string;
  avatar?: string | null;
}

export interface Project {
  id: number;
  name: string;
  workspace: string;
  role: string;
  progress: number;
  memberCount: number;
  lastActivity: string;
  color: string;
}

export interface Workspace {
  id: number;
  name: string;
  description: string;
  owner_id: number;
  projects: Project[];
}

export interface Node {
  id: number;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  x: number;
  y: number;
  assignees: Assignee[];
}

export interface Assignee {
  id: number;
  name: string;
  avatar: string | null;
}

export interface EditingCard {
  id: number;
  title: string;
  user: string;
}

export interface LoginResponse {
  message: string;
  user: AuthUser;
}

export interface SignupResponse {
  id: number;
  email: string;
  name: string;
  is_student_verified: boolean;
}

export interface VerifyResponse {
  message: string;
}