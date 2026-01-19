// ============================================
// 사용자 관련 타입
// ============================================

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthUser {
  email: string;
  name: string;
}

export interface Member extends User {
  isOnline: boolean;
  role: string;
  avatar?: string | null;
}

export interface Assignee {
  id: number;
  name: string;
  avatar: string | null;
}

// ============================================
// 워크스페이스 관련 타입
// ============================================

export interface Workspace {
  id: number;
  name: string;
  description?: string;
  owner_id: number;
  projects: Project[];
}

// ============================================
// 프로젝트 관련 타입
// ============================================

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

export interface ProjectSummary {
  id: number;
  name: string;
  progress: number;
  memberCount: number;
  lastActivity: string;
}

// ============================================
// 보드/노드 관련 타입
// ============================================

export type NodeStatus = 'todo' | 'in-progress' | 'done';

export interface Node {
  id: number;
  title: string;
  status: NodeStatus;
  x: number;
  y: number;
  assignees: Assignee[];
}

export interface Connection {
  from: number;
  to: number;
}

// ============================================
// 작업/태스크 관련 타입
// ============================================

export interface Task {
  id: number;
  title: string;
  project: string;
  dueTime: string;
}

export interface EditingCard {
  id: number;
  title: string;
  user: string;
}

// ============================================
// 파일 관련 타입 (향후 사용)
// ============================================

export interface FileItem {
  id: number;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedBy: User;
  versions?: FileVersion[];
}

export interface FileVersion {
  id: number;
  version: number;
  uploadedAt: string;
  uploadedBy: User;
  size: number;
}

// ============================================
// API 응답 타입
// ============================================

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
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
