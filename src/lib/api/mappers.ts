// src/lib/api/mappers.ts
// 백엔드 API 응답 -> 프론트엔드 타입 변환 함수들

import type { Task, Project, Member, User, Assignee, Tag, Comment, TaskFile } from '../../types';

// ============================================
// 사용자 관련 매퍼
// ============================================

export function mapUserResponse(user: any): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    is_student_verified: user.is_student_verified,
    profile_image: user.profile_image,
  };
}

export function mapToAssignee(user: any): Assignee {
  return {
    id: user.id,
    name: user.name,
    avatar: user.profile_image || null,
  };
}

export function mapWorkspaceMemberToMember(member: any): Member {
  return {
    id: member.user_id,
    name: member.name,
    email: member.email,
    role: member.role,
    isOnline: false, // 별도 API로 확인 필요
  };
}

// ============================================
// 프로젝트 관련 매퍼
// ============================================

const PROJECT_COLORS = ['#FEF3C7', '#DBEAFE', '#FCE7F3', '#D1FAE5', '#E9D5FF'];

export function mapProjectResponse(
  proj: any, 
  workspaceName: string,
  memberCount: number = 0
): Project {
  return {
    id: proj.id,
    name: proj.name,
    workspace: workspaceName,
    workspace_id: proj.workspace_id,
    description: proj.description,
    role: 'Member',
    progress: 0,
    memberCount,
    lastActivity: '방금 전',
    color: PROJECT_COLORS[proj.id % PROJECT_COLORS.length],
  };
}

// ============================================
// 태스크(카드) 관련 매퍼
// ============================================

// 백엔드 card_type/status -> 프론트 status 변환
function mapCardStatus(cardType?: string, columnTitle?: string): Task['status'] {
  if (columnTitle) {
    const lower = columnTitle.toLowerCase();
    if (lower.includes('done') || lower.includes('완료')) return 'done';
    if (lower.includes('doing') || lower.includes('진행')) return 'in-progress';
    if (lower.includes('inbox') || lower.includes('수신')) return 'inbox';
  }
  return 'todo';
}

// 백엔드 File -> 프론트 TaskFile 변환
export function mapFileToTaskFile(file: any): TaskFile {
  return {
    id: file.id,
    name: file.filename,
    url: file.latest_version 
      ? `/api/files/download/${file.latest_version.id}`
      : '#',
    size: file.latest_version?.file_size || 0,
    type: getFileType(file.filename),
  };
}

function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const typeMap: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
  };
  return typeMap[ext] || 'application/octet-stream';
}

// 백엔드 CardComment -> 프론트 Comment 변환
export function mapCardComment(comment: any): Comment {
  return {
    id: comment.id,
    user: comment.user?.name || 'Unknown',
    user_id: comment.user_id,
    text: comment.content,
    timestamp: formatTimestamp(comment.created_at),
  };
}

// 백엔드 Card -> 프론트 Task 변환
export function mapCardToTask(
  card: any, 
  boardId: number,
  columnTitle?: string
): Task {
  return {
    id: card.id,
    title: card.title,
    description: card.content || undefined,
    content: card.content || undefined,
    status: mapCardStatus(card.card_type, columnTitle),
    x: card.x || 0,
    y: card.y || 0,
    boardId,
    column_id: card.column_id,
    card_type: card.card_type,
    taskType: card.card_type === 'task' ? 0 : card.card_type === 'memo' ? 1 : undefined,
    assignees: (card.assignees || []).map(mapToAssignee),
    files: (card.files || []).map(mapFileToTaskFile),
    comments: (card.comments || []).map(mapCardComment),
    start_date: card.start_date,
    due_date: card.due_date,
    time: formatTaskTime(card.start_date, card.due_date),
    created_at: card.created_at,
    updated_at: card.updated_at,
  };
}

// 프론트 Task -> 백엔드 CardCreate/CardUpdate 변환
export function mapTaskToCardPayload(task: Partial<Task>): any {
  const payload: any = {};
  
  if (task.title !== undefined) payload.title = task.title;
  if (task.description !== undefined) payload.content = task.description;
  if (task.content !== undefined) payload.content = task.content;
  if (task.x !== undefined) payload.x = task.x;
  if (task.y !== undefined) payload.y = task.y;
  if (task.column_id !== undefined) payload.column_id = task.column_id;
  if (task.assignees !== undefined) {
    payload.assignee_ids = task.assignees.map(a => a.id);
  }
  if (task.start_date !== undefined) payload.start_date = task.start_date;
  if (task.due_date !== undefined) payload.due_date = task.due_date;
  if (task.taskType !== undefined) {
    payload.card_type = task.taskType === 0 ? 'task' : 'memo';
  }
  
  return payload;
}

// ============================================
// 유틸리티 함수
// ============================================

function formatTimestamp(isoString?: string): string {
  if (!isoString) return '방금 전';
  
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  
  return date.toLocaleDateString('ko-KR');
}

function formatTaskTime(startDate?: string, dueDate?: string): string | undefined {
  if (!startDate && !dueDate) return undefined;
  
  const formatDate = (d: string) => d.split('T')[0];
  
  if (startDate && dueDate) {
    return `${formatDate(startDate)}|${formatDate(dueDate)}`;
  }
  if (startDate) return formatDate(startDate);
  if (dueDate) return formatDate(dueDate);
  
  return undefined;
}
