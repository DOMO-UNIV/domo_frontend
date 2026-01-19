import type { Node, Connection, Member, EditingCard } from '@/types';
import { API_CONFIG, apiFetch, mockDelay } from './config';
import {
  MOCK_NODES,
  MOCK_CONNECTIONS,
  MOCK_MEMBERS,
  MOCK_EDITING_CARDS,
} from './mock-data';

// ============================================
// 노드 API
// ============================================

/**
 * 프로젝트의 노드 목록 조회
 */
export async function getNodes(projectId: number): Promise<Node[]> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(300);
    return MOCK_NODES;
  }

  return apiFetch<Node[]>(`/projects/${projectId}/nodes`);
}

/**
 * 노드 생성
 */
export async function createNode(
  projectId: number,
  node: Omit<Node, 'id'>
): Promise<Node> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(200);
    return {
      ...node,
      id: Date.now(),
    };
  }

  return apiFetch<Node>(`/projects/${projectId}/nodes`, {
    method: 'POST',
    body: JSON.stringify(node),
  });
}

/**
 * 노드 수정
 */
export async function updateNode(
  nodeId: number,
  updates: Partial<Node>
): Promise<Node> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(200);
    const node = MOCK_NODES.find(n => n.id === nodeId);
    if (!node) {
      throw new Error('노드를 찾을 수 없습니다.');
    }
    return { ...node, ...updates };
  }

  return apiFetch<Node>(`/nodes/${nodeId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

/**
 * 노드 삭제
 */
export async function deleteNode(nodeId: number): Promise<void> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(200);
    return;
  }

  await apiFetch<void>(`/nodes/${nodeId}`, {
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
    return MOCK_CONNECTIONS;
  }

  return apiFetch<Connection[]>(`/projects/${projectId}/connections`);
}

/**
 * 연결선 생성
 */
export async function createConnection(
  projectId: number,
  connection: Connection
): Promise<Connection> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(200);
    return connection;
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
  from: number,
  to: number
): Promise<void> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(200);
    return;
  }

  await apiFetch<void>(`/projects/${projectId}/connections`, {
    method: 'DELETE',
    body: JSON.stringify({ from, to }),
  });
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
