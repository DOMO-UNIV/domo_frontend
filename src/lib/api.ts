
import { AuthUser, Project, LoginResponse, Node, Connection, Member, EditingCard } from "../types";

export const MOCK_PROJECTS: Project[] = [
  {
    id: 1,
    name: '캡스톤디자인',
    workspace: 'School',
    role: 'Leader',
    progress: 75,
    memberCount: 4,
    lastActivity: '2 hours ago',
    color: '#FEF3C7'
  },
  {
    id: 2,
    name: '소프트웨어공학',
    workspace: 'School',
    role: 'Member',
    progress: 30,
    memberCount: 3,
    lastActivity: '1 day ago',
    color: '#DBEAFE'
  }
];

export const MOCK_NODES: Node[] = [
  {
    id: 1,
    title: '기획서 작성',
    status: 'done',
    x: 100,
    y: 100,
    assignees: [{ id: 1, name: '김도모', avatar: null }],
  },
  {
    id: 2,
    title: 'UI 디자인',
    status: 'in-progress',
    x: 350,
    y: 80,
    assignees: [{ id: 2, name: '이협업', avatar: null }],
  },
  {
    id: 3,
    title: '백엔드 API',
    status: 'in-progress',
    x: 350,
    y: 220,
    assignees: [{ id: 3, name: '박개발', avatar: null }],
  },
  {
    id: 4,
    title: '프론트엔드 개발',
    status: 'todo',
    x: 600,
    y: 150,
    assignees: [
      { id: 1, name: '김도모', avatar: null },
      { id: 2, name: '이협업', avatar: null },
    ],
  },
  {
    id: 5,
    title: '테스트',
    status: 'todo',
    x: 850,
    y: 150,
    assignees: [],
  },
];

export const MOCK_CONNECTIONS: Connection[] = [
  { id: 'c1', from: 1, to: 2 },
  { id: 'c2', from: 1, to: 3 },
  { id: 'c3', from: 2, to: 4 },
  { id: 'c4', from: 3, to: 4 },
  { id: 'c5', from: 4, to: 5 },
];

export const MOCK_MEMBERS: Member[] = [
  { id: 1, name: '김도모', email: 'student@jj.ac.kr', isOnline: true, role: 'PM' },
  { id: 2, name: '이협업', email: 'collab@jj.ac.kr', isOnline: true, role: 'Frontend' },
  { id: 3, name: '박개발', email: 'dev@jj.ac.kr', isOnline: false, role: 'Backend' },
  { id: 4, name: '최디자인', email: 'design@jj.ac.kr', isOnline: false, role: 'Designer' },
];

export const MOCK_EDITING_CARDS: EditingCard[] = [
  { id: 2, title: 'UI 디자인', user: '이협업' },
];

export async function login(email: string, password: string): Promise<LoginResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (email === 'student@jj.ac.kr' && password === 'test1234') {
    return {
      message: 'Success',
      user: {
        name: '김도모',
        email: email
      }
    };
  }
  throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
}

export async function logout(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300));
}

export async function getMyProjects(): Promise<Project[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_PROJECTS;
}
