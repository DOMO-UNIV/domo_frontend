import type { Task, Connection, Member, EditingCard, Comment, Column } from '../../types';
import { API_CONFIG, apiFetch, mockDelay } from './config';
import {
  MOCK_TASKS,
  MOCK_CONNECTIONS,
  MOCK_MEMBERS,
  MOCK_EDITING_CARDS,
} from './mock-data';

// ============================================
// 컬럼 API
// ============================================

/**
 * 프로젝트의 컬럼 목록 조회
 */
export async function getColumns(projectId: number): Promise<Column[]> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(200);
    // Mock 컬럼 데이터
    return [
      { id: 1, title: '할 일', status: 'todo', order: 0, project_id: projectId },
      { id: 2, title: '진행 중', status: 'doing', order: 1, project_id: projectId },
      { id: 3, title: '완료', status: 'done', order: 2, project_id: projectId },
    ];
  }

  return apiFetch<Column[]>(`/projects/${projectId}/columns`);
}

/**
 * 컬럼 생성
 */
export async function createColumn(
    projectId: number,
    data: { title: string; order?: number }
): Promise<Column> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(200);
    return {
      id: Date.now(),
      title: data.title,
      status: 'todo',
      order: data.order || 0,
      project_id: projectId,
    };
  }

  return apiFetch<Column>(`/projects/${projectId}/columns`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================
// 보드 API
// ============================================

/**
 * 프로젝트 전체 보드 조회 (컬럼 + 카드)
 */
export async function getBoard(projectId: number): Promise<{ column: Column; cards: Task[] }[]> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(300);
    const columns = [
      { id: 1, title: '할 일', status: 'todo' as const, order: 0, project_id: projectId },
      { id: 2, title: '진행 중', status: 'doing' as const, order: 1, project_id: projectId },
      { id: 3, title: '완료', status: 'done' as const, order: 2, project_id: projectId },
    ];

    return columns.map(col => ({
      column: col,
      cards: MOCK_TASKS.filter(t =>
          (t.boardId === projectId || projectId === 1) &&
          (t.status === col.status || (col.status === 'doing' && t.status === 'in-progress'))
      ),
    }));
  }

  return apiFetch<{ column: Column; cards: Task[] }[]>(`/projects/${projectId}/board`);
}

// ============================================
// 태스크(카드) API
// ============================================

/**
 * 프로젝트의 태스크 목록 조회
 */
export async function getTasks(projectId: number): Promise<Task[]> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(300);
    return MOCK_TASKS.filter(t => t.boardId === projectId || projectId === 1);
  }

  // 실제 API: 프로젝트의 보드 데이터 조회 후 카드 추출
  const response = await apiFetch<{ column: unknown; cards: Task[] }[]>(
      `/projects/${projectId}/board`
  );
  return response.flatMap(col => col.cards);
}

/**
 * 단일 태스크 조회
 */
export async function getTask(taskId: number): Promise<Task> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(200);
    const task = MOCK_TASKS.find(t => t.id === taskId);
    if (!task) {
      throw new Error('태스크를 찾을 수 없습니다.');
    }
    return task;
  }

  return apiFetch<Task>(`/cards/${taskId}`);
}

/**
 * 태스크 생성
 */
export async function createTask(
    columnId: number,
    task: Omit<Task, 'id'>
): Promise<Task> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(200);
    return {
      ...task,
      id: Date.now(),
    };
  }

  return apiFetch<Task>(`/columns/${columnId}/cards`, {
    method: 'POST',
    body: JSON.stringify({
      title: task.title,
      content: task.content || task.description,
      x: task.x,
      y: task.y,
      assignee_ids: task.assignees?.map(a => a.id) || [],
    }),
  });
}

/**
 * 태스크 수정
 */
export async function updateTask(
    taskId: number,
    updates: Partial<Task>
): Promise<Task> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(200);
    const task = MOCK_TASKS.find(t => t.id === taskId);
    if (!task) {
      throw new Error('태스크를 찾을 수 없습니다.');
    }
    return { ...task, ...updates };
  }

  return apiFetch<Task>(`/cards/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      title: updates.title,
      content: updates.content || updates.description,
      x: updates.x,
      y: updates.y,
      column_id: updates.column_id,
      assignee_ids: updates.assignees?.map(a => a.id),
    }),
  });
}

/**
 * 태스크 삭제
 */
export async function deleteTask(taskId: number): Promise<void> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(200);
    return;
  }

  await apiFetch<void>(`/cards/${taskId}`, {
    method: 'DELETE',
  });
}

// ============================================
// 댓글 API
// ============================================

/**
 * 카드의 댓글 목록 조회
 */
export async function getCardComments(cardId: number): Promise<Comment[]> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(200);
    // Mock 데이터에서 해당 카드의 댓글 반환
    const task = MOCK_TASKS.find(t => t.id === cardId);
    return task?.comments || [];
  }

  const response = await apiFetch<{
    id: number;
    card_id: number;
    user_id: number;
    content: string;
    created_at: string;
    updated_at: string;
    user?: { id: number; name: string; email: string };
  }[]>(`/cards/${cardId}/comments`);

  // 백엔드 응답을 프론트엔드 Comment 타입으로 변환
  return response.map(c => ({
    id: c.id,
    user: c.user?.name || `User ${c.user_id}`,
    user_id: c.user_id,
    text: c.content,
    timestamp: formatTimestamp(c.created_at),
  }));
}

/**
 * 카드에 댓글 추가
 */
export async function createCardComment(cardId: number, content: string): Promise<Comment> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(300);
    return {
      id: Date.now(),
      user: '김도모',
      user_id: 1,
      text: content,
      timestamp: '방금 전',
    };
  }

  const response = await apiFetch<{
    id: number;
    card_id: number;
    user_id: number;
    content: string;
    created_at: string;
    updated_at: string;
    user?: { id: number; name: string; email: string };
  }>(`/cards/${cardId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });

  return {
    id: response.id,
    user: response.user?.name || `User ${response.user_id}`,
    user_id: response.user_id,
    text: response.content,
    timestamp: formatTimestamp(response.created_at),
  };
}

/**
 * 댓글 삭제
 */
export async function deleteCardComment(commentId: number): Promise<void> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(200);
    return;
  }

  await apiFetch<void>(`/cards/comments/${commentId}`, {
    method: 'DELETE',
  });
}

// ============================================
// 연결선 API
// ============================================

/**
 * 프로젝트의 연결선 목록 조회
 */
export async function getConnections(projectId: number): Promise<Connection[]> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(200);
    return MOCK_CONNECTIONS.filter(c => c.boardId === projectId || projectId === 1);
  }

  return apiFetch<Connection[]>(`/projects/${projectId}/connections`);
}

/**
 * 연결선 생성
 */
export async function createConnection(
    projectId: number,
    connection: Omit<Connection, 'id'>
): Promise<Connection> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(200);
    return {
      ...connection,
      id: Date.now(),
    };
  }

  return apiFetch<Connection>(`/projects/${projectId}/connections`, {
    method: 'POST',
    body: JSON.stringify(connection),
  });
}

/**
 * 연결선 삭제
 */
export async function deleteConnection(
    projectId: number,
    connectionId: number
): Promise<void> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(200);
    return;
  }

  const conn = MOCK_CONNECTIONS.find(c => c.id === connectionId);
  if (conn) {
    await apiFetch<void>(`/projects/${projectId}/connections`, {
      method: 'DELETE',
      body: JSON.stringify({ from: conn.from, to: conn.to }),
    });
  }
}

// ============================================
// 팀 멤버 API (보드용)
// ============================================

/**
 * 프로젝트 팀 멤버 조회 (온/오프라인 상태 포함)
 */
export async function getBoardMembers(projectId: number): Promise<Member[]> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(200);
    return MOCK_MEMBERS;
  }

  return apiFetch<Member[]>(`/projects/${projectId}/members`);
}

// ============================================
// 실시간 편집 상태 API
// ============================================

/**
 * 현재 수정 중인 카드 목록 조회
 */
export async function getEditingCards(projectId: number): Promise<EditingCard[]> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(100);
    return MOCK_EDITING_CARDS;
  }

  return apiFetch<EditingCard[]>(`/projects/${projectId}/editing-cards`);
}

/**
 * 카드 편집 시작 알림
 */
export async function startEditingCard(cardId: number): Promise<void> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(100);
    return;
  }

  await apiFetch<void>(`/cards/${cardId}/editing`, {
    method: 'POST',
  });
}

/**
 * 카드 편집 종료 알림
 */
export async function stopEditingCard(cardId: number): Promise<void> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(100);
    return;
  }

  await apiFetch<void>(`/cards/${cardId}/editing`, {
    method: 'DELETE',
  });
}

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 타임스탬프를 읽기 쉬운 형식으로 변환
 */
function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ============================================
// 하위 호환용 (기존 코드에서 사용하던 함수명)
// ============================================

export const getNodes = getTasks;
export const createNode = createTask;
export const updateNode = updateTask;
export const deleteNode = deleteTask;