# DOMO - 협업 워크스페이스 플랫폼

비전 있는 팀을 위한 현대적인 협업 도구. 실시간 보드, 캔버스 기반 태스크 관리, 파일 공유, **음성 채팅**을 하나의 플랫폼에서 제공합니다.

---

## 📚 목차
1. [기술 스택](#1-기술-스택-tech-stack)
2. [프로젝트 구조](#2-프로젝트-구조-project-structure)
3. [핵심 기능](#3-핵심-기능-core-features)
4. [컴포넌트 상세](#4-컴포넌트-상세-component-details)
5. [API 아키텍처](#5-api-아키텍처-api-architecture)
6. [타입 시스템](#6-타입-시스템-type-system)
7. [개발 가이드](#7-개발-가이드-development-guide)
8. [환경 설정](#8-환경-설정-environment-setup)
9. [배포](#9-배포-deployment)
10. [트러블슈팅](#10-트러블슈팅-troubleshooting)

---

## 1. 기술 스택 (Tech Stack)

### Frontend
| 기술 | 버전 | 용도 |
|------|------|------|
| **Node.js** | 22.15.0 | 런타임 |
| **Next.js** | 15+ | App Router 기반 프레임워크 |
| **React** | 19+ | UI 라이브러리 |
| **TypeScript** | 5.8+ | 타입 안전성 (Strict Mode) |
| **Tailwind CSS** | 4 | 스타일링 (Inline @theme) |
| **Lucide React** | - | 아이콘 라이브러리 |

### 실시간 통신
| 기술 | 용도 |
|------|------|
| **WebSocket** | 시그널링 서버 연결 |
| **WebRTC** | P2P 음성 채팅 |
| **STUN Server** | NAT 트래버설 (`stun.l.google.com`) |

### Backend Integration
- **API Client**: Custom `apiFetch` wrapper (Fetch API 기반, 쿠키 인증)
- **Data Layer**: `/lib/api` - Type-safe API interface
- **Mock Mode**: 개발 환경용 Mock 데이터 지원

---

## 2. 프로젝트 구조 (Project Structure)

```bash
src/
├── app/                          # Next.js App Router
│   ├── components/               # React 컴포넌트
│   │   ├── board/                # 🎯 핵심: 캔버스 보드 시스템
│   │   │   ├── BoardCanvas.tsx         # 무한 캔버스, 드래그&드롭, 연결선
│   │   │   ├── WorkspaceBoard.tsx      # 프로젝트 보드 메인 컨테이너
│   │   │   └── Views.tsx               # SettingsView, CalendarView, TimelineView
│   │   │
│   │   ├── dock/                 # macOS 스타일 하단 독바
│   │   │   ├── Dock.tsx                # 메인 독 (뷰 전환 + 음성채팅 + 멤버)
│   │   │   ├── DockButton.tsx          # 독 버튼 컴포넌트
│   │   │   └── index.ts
│   │   │
│   │   ├── ui/                   # 재사용 가능한 UI 컴포넌트
│   │   │   ├── TaskCard.tsx            # 태스크 카드 (포스트잇/파일)
│   │   │   ├── TaskDetailModal.tsx     # 태스크 상세 모달
│   │   │   ├── ProjectSelect.tsx       # 프로젝트 선택 + 설정 화면
│   │   │   └── Mascot.tsx              # 브랜드 마스코트 SVG
│   │   │
│   │   ├── mypage/               # 마이페이지 컴포넌트
│   │   │   ├── MyPageView.tsx          # 마이페이지 메인 뷰
│   │   │   ├── ProfileCard.tsx         # 프로필 카드 (이미지/이름 수정)
│   │   │   └── ActivityList.tsx        # 활동 로그 리스트
│   │   │
│   │   ├── LoginScreen.tsx       # 로그인 화면
│   │   ├── SignupScreen.tsx      # 회원가입 화면
│   │   ├── VerifyEmailScreen.tsx # 이메일 인증 대기 화면
│   │   └── VerifySuccessScreen.tsx # 인증 성공 화면
│   │
│   ├── globals.css               # Tailwind 글로벌 스타일 + 다크모드
│   ├── layout.tsx                # 루트 레이아웃
│   └── page.tsx                  # 루트 페이지 (인증 분기)
│
├── hooks/                        # 커스텀 React Hooks
│   └── useVoiceChat.ts           # 🎤 WebRTC 음성 채팅 훅
│
├── lib/                          # 비즈니스 로직 & 유틸리티
│   ├── api/                      # 🔥 백엔드 통신 계층
│   │   ├── config.ts             # API 설정 (Mock/Real, Base URL, WebSocket)
│   │   ├── mappers.ts            # Backend ↔ Frontend 타입 변환
│   │   ├── auth.ts               # 인증 (로그인, 회원가입, 이메일 인증, 로그아웃)
│   │   ├── board.ts              # 보드, 컬럼, 카드(태스크), 연결선, 댓글
│   │   ├── workspace.ts          # 워크스페이스, 프로젝트, 멤버, 초대
│   │   ├── file.ts               # 파일 업로드/다운로드/버전 관리
│   │   ├── user.ts               # 사용자 정보 조회/수정, 프로필 이미지
│   │   ├── activity.ts           # 활동 로그
│   │   ├── schedule.ts           # 시간표, 팀 공통 빈 시간, 프로젝트 일정
│   │   ├── mock-data.ts          # 개발용 Mock 데이터
│   │   └── index.ts              # API 통합 export
│   │
│   └── utils/
│       └── canvas.ts             # 캔버스 색상/스타일 유틸리티
│
└── types/
    └── index.ts                  # 📝 TypeScript 타입 정의 (전역)
```

---

## 3. 핵심 기능 (Core Features)

### 🎨 무한 캔버스 보드
| 기능 | 설명 |
|------|------|
| **드래그 앤 드롭** | 포스트잇 스타일 태스크 카드 자유 배치 |
| **연결선** | 태스크 간 관계 시각화 (Bezier/Straight, Solid/Dashed) |
| **그룹핑** | 여러 카드를 그룹으로 묶기 (`Ctrl + Select`) |
| **스냅 투 그리드** | 정렬 도우미 |
| **파일 카드** | 파일 업로드 → 캔버스에 파일 카드 생성 |
| **줌 & 팬** | 캔버스 확대/축소 및 이동 |

### 📋 다중 뷰 모드
| 뷰 | 컴포넌트 | 설명 |
|------|------|------|
| **Board** | `BoardCanvas.tsx` | 무한 캔버스 (기본) |
| **Calendar** | `CalendarView` | 월별 캘린더 뷰 |
| **Timeline** | `TimelineView` | 간트 차트 스타일 타임라인 |
| **Settings** | `SettingsView` | 프로필 설정 + 환경설정 |
| **MyPage** | `MyPageView` | 프로필 카드 + 활동 로그 |

### 🎤 실시간 음성 채팅 (WebRTC)
```
┌─────────────┐     WebSocket      ┌──────────────┐
│   Client A  │ ◄─────────────────► │ Signal Server│
└──────┬──────┘                     └──────┬───────┘
       │                                   │
       │  Offer/Answer/ICE                 │
       │◄──────────────────────────────────┤
       │                                   │
       │         P2P Audio Stream          │
       │◄─────────────────────────────────►│
       │                                   │
┌──────▼──────┐                     ┌──────▼───────┐
│   Client B  │ ◄─────────────────► │ Signal Server│
└─────────────┘     WebSocket       └──────────────┘
```

**기능:**
- 음성 채널 참여/퇴장
- 마이크 음소거 (Mute)
- 스피커 음소거 (Deafen)
- 현재 음성 채팅 참여자 표시

### 💬 실시간 협업
- **댓글 시스템**: 카드별 댓글 (생성/삭제)
- **온라인 멤버**: 현재 접속 중인 팀원 표시
- **편집 중 표시**: 다른 사용자가 편집 중인 카드 하이라이트

### 🔐 인증 & 권한
| 기능 | 설명 |
|------|------|
| **학교 이메일 인증** | `@jj.ac.kr` 도메인 검증 |
| **쿠키 기반 세션** | `credentials: 'include'` |
| **워크스페이스 멤버십** | 초대 링크 기반 팀 구성 |
| **역할 기반 권한** | Owner, Member 등 |

### 👤 프로필 관리
- **프로필 이미지 업로드**: 클릭하여 이미지 변경
- **인라인 이름 편집**: 이름 옆 편집 버튼 → 저장
- **슬랙 스타일 프로필**: 온라인 상태, 현지 시간, 연락처 정보

---

## 4. 컴포넌트 상세 (Component Details)

### 4.1 ProjectSelect.tsx

프로젝트 선택 화면 + 마이페이지 + 설정 통합 컴포넌트

```typescript
type ViewState = 'projects' | 'mypage' | 'settings';

// 주요 기능
- 프로젝트 목록 그리드 뷰
- 워크스페이스/프로젝트 생성 모달
- 프로젝트 컨텍스트 메뉴 (삭제)
- 상단 프로필 드롭다운 메뉴 (프로필/환경설정/로그아웃)
- 설정 뷰 (SettingsView 연동)
- 마이페이지 뷰 (ProfileCard + ActivityList)
```

### 4.2 SettingsView (Views.tsx)

슬랙 스타일 설정 화면

```typescript
interface SettingsViewProps {
  initialTab?: 'profile' | 'preferences';
  onLogout?: () => void;
  user?: { name: string; email: string; profile_image?: string | null };
}

// 프로필 탭
- 큰 아바타 (클릭하여 이미지 업로드)
- 인라인 이름 편집
- 온라인 상태, 현지 시간
- 연락처 정보, 내 소개

// 환경설정 탭
- 다크 모드 토글
- 알림 설정
- 개인정보 및 보안
- 로그아웃
```

### 4.3 Dock.tsx

macOS 스타일 하단 독바

```typescript
interface DockProps {
  activeMenu: string;
  onMenuChange: (menu: string) => void;
  editingCards: EditingCard[];
  members: Member[];
  showMembers: boolean;
  setShowMembers: (show: boolean) => void;
  projectId: number;
  currentUserId: number;
}

// 메뉴 버튼
- 대시보드, 파일, 마이페이지, 보드, 캘린더, 타임라인, 설정

// 음성 채팅 (useVoiceChat 훅 연동)
- 참여/퇴장 버튼
- 마이크/스피커 음소거
- 현재 참여자 리스트

// 온라인 멤버
- 현재 접속 중인 팀원 아바타
```

### 4.4 useVoiceChat Hook

WebRTC 기반 음성 채팅 훅

```typescript
function useVoiceChat(projectId: number, userId: number) {
  return {
    isConnected: boolean;      // 음성 채널 연결 상태
    isMuted: boolean;          // 마이크 음소거 상태
    isDeafened: boolean;       // 스피커 음소거 상태
    activePeerIds: number[];   // 현재 연결된 피어 ID 목록
    
    joinVoiceChannel: () => void;   // 채널 참여
    leaveVoiceChannel: () => void;  // 채널 퇴장
    toggleMute: () => void;         // 마이크 토글
    toggleDeafen: () => void;       // 스피커 토글
  };
}
```

---

## 5. API 아키텍처 (API Architecture)

### 5.1 구조 개요

```
┌─────────────┐
│  Component  │  (UI Layer)
└──────┬──────┘
       │ calls
┌──────▼──────────────┐
│  API Functions      │  (lib/api/*.ts)
│  - getTasks()       │
│  - createTask()     │
│  - login()          │
└──────┬──────────────┘
       │
   ┌───▼────┐
   │ Mock?  │  (API_CONFIG.USE_MOCK)
   └───┬────┘
       │
   ┌───▼────────────────┐       ┌──────────────┐
   │ YES: mock-data.ts  │       │              │
   │ NO:  apiFetch()    │ ───►  │ Backend API  │
   └────────────────────┘       └──────────────┘
```

### 5.2 주요 API 모듈

| 파일 | 역할 | 주요 함수 |
|------|------|-----------|
| **auth.ts** | 인증 | `login()`, `signup()`, `verify()`, `logout()`, `checkAuth()` |
| **board.ts** | 보드/태스크 | `getTasks()`, `createTask()`, `updateTask()`, `deleteTask()` |
| | 댓글 | `getCardComments()`, `createCardComment()`, `deleteCardComment()` |
| | 연결선 | `getConnections()`, `createConnection()`, `deleteConnection()` |
| **workspace.ts** | 워크스페이스 | `getWorkspaces()`, `createWorkspace()`, `deleteWorkspace()` |
| | 프로젝트 | `getMyProjects()`, `createProject()`, `deleteProject()` |
| | 멤버 | `getWorkspaceMembers()`, `addWorkspaceMember()`, `createInvitation()` |
| **file.ts** | 파일 관리 | `uploadFile()`, `deleteFile()`, `attachFileToCard()` |
| **schedule.ts** | 일정 | `getMySchedules()`, `getCommonFreeTime()`, `getProjectEvents()` |
| **user.ts** | 사용자 | `getMyInfo()`, `updateMyInfo()`, `updateProfileImage()` |
| **activity.ts** | 활동 | `getMyActivities()` |

### 5.3 API 설정 (config.ts)

```typescript
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api',
  USE_MOCK: process.env.NEXT_PUBLIC_USE_MOCK === 'true',
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:9000',
};

// apiFetch - 공통 API 호출 함수
export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    credentials: 'include',  // 쿠키 인증
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

// apiUpload - 파일 업로드용 (FormData)
export async function apiUpload<T>(endpoint: string, formData: FormData, options?: RequestInit): Promise<T>;

// getWebSocketUrl - WebSocket URL 생성
export function getWebSocketUrl(path: string): string;
```

### 5.4 타입 매퍼 (mappers.ts)

백엔드 API 응답과 프론트엔드 타입 간 변환:

```typescript
// 백엔드 Card → 프론트 Task
export function mapCardToTask(
  card: BackendCardResponse, 
  boardId: number, 
  columnOrder: number
): Task;

// 프론트 Task → 백엔드 CardPayload
export function mapTaskToCardPayload(task: Partial<Task>): CardCreate | CardUpdate;

// Column order → Status 매핑
// order: 0 → status: 'todo'
// order: 1 → status: 'in-progress' (또는 'doing')
// order: 2 → status: 'done'
```

---

## 6. 타입 시스템 (Type System)

### 6.1 사용자 관련

```typescript
// 전체 사용자 정보 (API 응답)
interface User {
  id: number;
  email: string;
  name: string;
  is_student_verified?: boolean;
  profile_image?: string | null;
}

// 인증된 사용자 (세션)
interface AuthUser {
  email: string;
  name: string;
}

// 팀 멤버
interface Member {
  id: number;
  name: string;
  email: string;
  isOnline: boolean;
  role: string;
  avatar?: string | null;
}
```

### 6.2 워크스페이스 & 프로젝트

```typescript
interface Workspace {
  id: number;
  name: string;
  description: string;
  owner_id: number;
  projects: Project[];
}

interface Project {
  id: number;
  name: string;
  workspace: string;
  workspace_id?: number;
  role: string;
  progress: number;
  memberCount: number;
  lastActivity: string;
  color: string;
  description?: string;
}
```

### 6.3 태스크 (캔버스 카드)

```typescript
type TaskStatus = 'inbox' | 'todo' | 'doing' | 'in-progress' | 'done';

interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  content?: string;
  description?: string;

  // 캔버스 위치
  x: number;
  y: number;

  // 분류
  boardId: number;       // 프론트에서 프로젝트 ID
  column_id?: number;    // 백엔드 컬럼 ID
  taskType?: number;     // 0: 일, 1: 메모, 2: 파일
  card_type?: string;    // 백엔드 card_type

  // 시간
  time?: string;         // 표시용 (start|end 형식)
  start_date?: string;
  due_date?: string;

  // 관계
  color?: string;
  tags?: Tag[];
  comments?: Comment[];
  files?: TaskFile[];
  assignees?: Assignee[];

  // 메타
  created_at?: string;
  updated_at?: string;
}
```

### 6.4 연결선 & 그룹

```typescript
interface Connection {
  id: number;
  from: number;     // Task ID
  to: number;       // Task ID
  shape?: 'bezier' | 'straight';
  style?: 'solid' | 'dashed';
  boardId?: number;
}

interface Group {
  id: number;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  boardId?: number;
}
```

### 6.5 음성 채팅

```typescript
interface SignalData {
  type: 'join' | 'offer' | 'answer' | 'ice' | 'user_left';
  senderId: number;
  targetId?: number;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

interface VoiceChatState {
  isConnected: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  activePeerIds: number[];
}
```

---

## 7. 개발 가이드 (Development Guide)

### 7.1 시작하기

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정 (.env.local 생성)
NEXT_PUBLIC_API_URL=http://localhost:9000/api
NEXT_PUBLIC_WS_URL=ws://localhost:9000
NEXT_PUBLIC_USE_MOCK=false  # true = Mock 모드

# 3. 개발 서버 실행
npm run dev

# 4. Turbopack 사용 (빠른 HMR)
npm run dev -- --turbo
```

### 7.2 Mock 모드 활용

백엔드 서버 없이 UI 개발:

```typescript
// lib/api/config.ts
export const API_CONFIG = {
  USE_MOCK: process.env.NEXT_PUBLIC_USE_MOCK === 'true',
};

// 각 API 함수에서
export async function getTasks(projectId: number): Promise<Task[]> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(300);
    return MOCK_TASKS.filter(t => t.boardId === projectId);
  }
  // Real API call
  const data = await apiFetch<BackendBoardResponse[]>(`/projects/${projectId}/board`);
  return data.flatMap(/* ... */);
}
```

### 7.3 새 API 추가 방법

**Step 1**: 타입 정의 (`types/index.ts`)
```typescript
export interface NewFeature {
  id: number;
  name: string;
}
```

**Step 2**: API 함수 작성 (`lib/api/new-feature.ts`)
```typescript
import { API_CONFIG, apiFetch, mockDelay } from './config';

export async function getNewFeature(): Promise<NewFeature[]> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(200);
    return [{ id: 1, name: 'Mock Feature' }];
  }
  return apiFetch<NewFeature[]>('/new-features');
}
```

**Step 3**: Export (`lib/api/index.ts`)
```typescript
export { getNewFeature } from './new-feature';
```

**Step 4**: 컴포넌트에서 사용
```typescript
import { getNewFeature } from '@/lib/api';

useEffect(() => {
  getNewFeature().then(setData);
}, []);
```

### 7.4 컴포넌트 개발 패턴

#### 📌 낙관적 UI 업데이트 (Optimistic Update)
```typescript
const handleCreateTask = async (taskData: Partial<Task>) => {
  // 1. 즉시 UI 업데이트 (임시 ID)
  const tempTask = { ...taskData, id: Date.now() } as Task;
  setTasks(prev => [...prev, tempTask]);

  try {
    // 2. 실제 API 호출
    const savedTask = await createTask(projectId, taskData);
    
    // 3. 실제 데이터로 교체
    setTasks(prev => prev.map(t => 
      t.id === tempTask.id ? savedTask : t
    ));
  } catch (err) {
    // 4. 실패 시 롤백
    setTasks(prev => prev.filter(t => t.id !== tempTask.id));
    console.error('Failed to create task:', err);
  }
};
```

#### 📌 프로필 드롭다운 메뉴 패턴
```typescript
const profileMenuRef = useRef<HTMLDivElement>(null);
const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

// 외부 클릭 시 닫기
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
      setIsProfileMenuOpen(false);
    }
  };
  if (isProfileMenuOpen) {
    document.addEventListener('mousedown', handleClickOutside);
  }
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [isProfileMenuOpen]);
```

#### 📌 탭 전환 시 상태 동기화
```typescript
// SettingsView에서 initialTab prop이 변경되면 내부 상태 동기화
const [activeTab, setActiveTab] = useState<'profile' | 'preferences'>(initialTab);

useEffect(() => {
  setActiveTab(initialTab);
}, [initialTab]);

// 부모 컴포넌트에서 key prop으로 리렌더링 강제
<SettingsView key={settingsTab} initialTab={settingsTab} />
```

---

## 8. 환경 설정 (Environment Setup)

### 8.1 환경 변수 (`.env.local`)

```bash
# API 서버 주소
NEXT_PUBLIC_API_URL=http://localhost:9000/api

# WebSocket 서버 주소 (음성 채팅 시그널링)
NEXT_PUBLIC_WS_URL=ws://localhost:9000

# Mock 모드 (개발용)
NEXT_PUBLIC_USE_MOCK=false

# 선택 사항
NEXT_PUBLIC_FILE_UPLOAD_MAX_SIZE=10485760  # 10MB
```

### 8.2 TypeScript 설정

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### 8.3 Tailwind 설정

`app/globals.css`:
```css
@import "tailwindcss";

:root {
  --bg-primary: #f5f5f7;
  --accent: #0071e3;
  --domo-primary: #3b82f6;
  --domo-highlight: #8b5cf6;
}

.dark {
  --bg-primary: #000000;
  --accent: #0a84ff;
}

/* Glass morphism */
.glass-panel {
  @apply bg-white/70 dark:bg-[#1c1c1e]/70 backdrop-blur-xl;
}

.glass-card {
  @apply bg-white/60 dark:bg-[#1c1c1e]/60 backdrop-blur-lg 
         border border-white/20 dark:border-white/10;
}
```

---

## 9. 배포 (Deployment)

### 9.1 프로덕션 빌드

```bash
# 빌드
npm run build

# 로컬 프로덕션 테스트
npm run start
```

### 9.2 Vercel 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel --prod
```

**환경 변수 설정** (Vercel Dashboard):
- `NEXT_PUBLIC_API_URL`: 프로덕션 API 서버 주소
- `NEXT_PUBLIC_WS_URL`: 프로덕션 WebSocket 서버 주소
- `NEXT_PUBLIC_USE_MOCK`: `false`

---

## 10. 트러블슈팅 (Troubleshooting)

### Q: "Module not found: Can't resolve '@/...'"
→ `tsconfig.json`의 `paths` 설정 확인
```json
{
  "compilerOptions": {
    "paths": { "@/*": ["./*"] }
  }
}
```

### Q: API 호출 시 CORS 에러
→ 백엔드에서 CORS 허용 설정 필요
```python
# FastAPI 예시
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Q: 쿠키가 전송되지 않음
→ `credentials: 'include'` 확인 (config.ts의 apiFetch)

### Q: Mock 모드가 적용 안 됨
→ `.env.local` 파일 수정 후 **서버 재시작 필수**

### Q: 음성 채팅이 연결되지 않음
→ WebSocket URL 확인 (`NEXT_PUBLIC_WS_URL`)
→ STUN 서버 접근 가능 여부 확인
→ 브라우저 마이크 권한 허용 확인

### Q: 프로필 드롭다운에서 설정 탭 전환이 안 됨
→ `SettingsView`에 `key={settingsTab}` prop 추가
→ `useEffect`로 `initialTab` 변경 시 내부 상태 동기화

### Q: 타입 에러: "Property 'column_id' does not exist"
→ `types/index.ts`에 필드 추가 후 컴파일 재시작

---

## 📚 참고 문서

- [Next.js App Router](https://nextjs.org/docs/app)
- [React 19 Docs](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 📄 라이선스

MIT License

---

## 👥 Contributors

- Team DOMO

---

**Last Updated**: 2025-01-21