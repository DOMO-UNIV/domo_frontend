"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ============================================
// API 설정
// ============================================
const API_CONFIG = {
    BASE_URL: 'http://localhost:8000/api',
    USE_MOCK: true,
};

// 목업 데이터
const MOCK_NODES: Node[] = [
    { id: 1, title: '기획서 작성', status: 'done', x: 100, y: 100, assignees: [{ id: 1, name: '김도모', avatar: null }] },
    { id: 2, title: 'UI 디자인', status: 'in-progress', x: 350, y: 80, assignees: [{ id: 2, name: '이협업', avatar: null }] },
    { id: 3, title: '백엔드 API', status: 'in-progress', x: 350, y: 220, assignees: [{ id: 3, name: '박개발', avatar: null }] },
    { id: 4, title: '프론트엔드 개발', status: 'todo', x: 600, y: 150, assignees: [{ id: 1, name: '김도모', avatar: null }, { id: 2, name: '이협업', avatar: null }] },
    { id: 5, title: '테스트', status: 'todo', x: 850, y: 150, assignees: [] },
];

const MOCK_CONNECTIONS = [
    { from: 1, to: 2 },
    { from: 1, to: 3 },
    { from: 2, to: 4 },
    { from: 3, to: 4 },
    { from: 4, to: 5 },
];

const MOCK_MEMBERS = [
    { id: 1, name: '김도모', email: 'student@jj.ac.kr', isOnline: true, role: 'PM' },
    { id: 2, name: '이협업', email: 'collab@jj.ac.kr', isOnline: true, role: 'Frontend' },
    { id: 3, name: '박개발', email: 'dev@jj.ac.kr', isOnline: false, role: 'Backend' },
    { id: 4, name: '최디자인', email: 'design@jj.ac.kr', isOnline: false, role: 'Designer' },
];

const MOCK_EDITING_CARDS = [
    { id: 2, title: 'UI 디자인', user: '이협업' },
];

// ============================================
// 타입
// ============================================
interface Assignee {
    id: number;
    name: string;
    avatar: string | null;
}

interface Node {
    id: number;
    title: string;
    status: 'todo' | 'in-progress' | 'done';
    x: number;
    y: number;
    assignees: Assignee[];
}

interface Connection {
    from: number;
    to: number;
}

interface Member {
    id: number;
    name: string;
    email: string;
    isOnline: boolean;
    role: string;
}

interface EditingCard {
    id: number;
    title: string;
    user: string;
}

interface Project {
    id: number;
    name: string;
    workspace: string;
    role: string;
    progress: number;
    memberCount: number;
    lastActivity: string;
    color: string;
}

interface BlueprintBoardProps {
    project: Project;
    onBack: () => void;
}

// ============================================
// Dock 컴포넌트
// ============================================
function Dock({
                  activeMenu,
                  onMenuChange,
                  editingCards,
                  members,
                  showMembers,
                  setShowMembers,
              }: {
    activeMenu: string;
    onMenuChange: (menu: string) => void;
    editingCards: EditingCard[];
    members: Member[];
    showMembers: boolean;
    setShowMembers: (show: boolean) => void;
}) {
    const onlineCount = members.filter(m => m.isOnline).length;

    return (
        <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-2 rounded-2xl shadow-lg border"
            style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-primary)',
            }}
        >
            {/* 왼쪽 메뉴 */}
            <div className="flex items-center gap-1 pr-3 border-r" style={{ borderColor: 'var(--border-primary)' }}>
                <DockButton
                    icon="📋"
                    label="대시보드"
                    isActive={activeMenu === 'dashboard'}
                    onClick={() => onMenuChange('dashboard')}
                />
                <DockButton
                    icon="📁"
                    label="파일"
                    isActive={activeMenu === 'files'}
                    onClick={() => onMenuChange('files')}
                />
                <DockButton
                    icon="👤"
                    label="마이페이지"
                    isActive={activeMenu === 'mypage'}
                    onClick={() => onMenuChange('mypage')}
                />
            </div>

            {/* 온라인 멤버 */}
            <div
                className="relative px-3"
                onMouseEnter={() => setShowMembers(true)}
                onMouseLeave={() => setShowMembers(false)}
            >
                <button className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors hover:bg-[var(--bg-secondary)]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {onlineCount}명 온라인
            </span>
          </span>
                </button>

                {/* 멤버 목록 팝업 */}
                {showMembers && (
                    <div
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-xl shadow-lg border"
                        style={{
                            backgroundColor: 'var(--bg-primary)',
                            borderColor: 'var(--border-primary)',
                        }}
                    >
                        <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>
                            팀 멤버
                        </p>
                        <div className="space-y-2">
                            {members.map(member => (
                                <div key={member.id} className="flex items-center gap-3">
                                    <div className="relative">
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                                            style={{
                                                backgroundColor: 'var(--bg-tertiary)',
                                                color: 'var(--text-primary)',
                                            }}
                                        >
                                            {member.name.charAt(0)}
                                        </div>
                                        <span
                                            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${
                                                member.isOnline ? 'bg-green-500' : 'bg-gray-400'
                                            }`}
                                            style={{ borderColor: 'var(--bg-primary)' }}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                            {member.name}
                                        </p>
                                        <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                                            {member.role}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 수정중인 카드 */}
            {editingCards.length > 0 && (
                <div className="flex items-center gap-1 pl-3 border-l" style={{ borderColor: 'var(--border-primary)' }}>
                    {editingCards.map(card => (
                        <div
                            key={card.id}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                            style={{ backgroundColor: 'var(--bg-secondary)' }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span style={{ color: 'var(--text-secondary)' }}>
                {card.user}
              </span>
                            <span style={{ color: 'var(--text-tertiary)' }}>
                {card.title}
              </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function DockButton({
                        icon,
                        label,
                        isActive,
                        onClick
                    }: {
    icon: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`group relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${
                isActive ? 'bg-[var(--bg-tertiary)]' : 'hover:bg-[var(--bg-secondary)]'
            }`}
        >
            <span className="text-xl">{icon}</span>

            {/* 툴팁 */}
            <span
                className="absolute bottom-full mb-2 px-2 py-1 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                }}
            >
        {label}
      </span>
        </button>
    );
}

// ============================================
// 메인 컴포넌트
// ============================================
export function BlueprintBoard({ project, onBack }: BlueprintBoardProps) {
    const [nodes, setNodes] = useState<Node[]>(MOCK_NODES);
    const [connections] = useState<Connection[]>(MOCK_CONNECTIONS);
    const [members] = useState<Member[]>(MOCK_MEMBERS);
    const [editingCards] = useState<EditingCard[]>(MOCK_EDITING_CARDS);

    const [isDark, setIsDark] = useState(true);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [draggingNode, setDraggingNode] = useState<number | null>(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [activeMenu, setActiveMenu] = useState('dashboard');
    const [showMembers, setShowMembers] = useState(false);
    const canvasRef = useRef<HTMLDivElement>(null);

    const [isConnecting, setIsConnecting] = useState(false);
    const [connectFrom, setConnectFrom] = useState<number | null>(null);

    useEffect(() => {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDark(prefersDark);
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
    }, [isDark]);

    const handleMouseDown = (e: React.MouseEvent, nodeId: number) => {
        if (isConnecting) {
            if (connectFrom === null) {
                setConnectFrom(nodeId);
            }
            return;
        }

        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        setDraggingNode(nodeId);
        setOffset({
            x: e.clientX - node.x,
            y: e.clientY - node.y,
        });
    };

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (draggingNode === null) return;

        setNodes(prev => prev.map(node =>
            node.id === draggingNode
                ? { ...node, x: e.clientX - offset.x, y: e.clientY - offset.y }
                : node
        ));
    }, [draggingNode, offset]);

    const handleMouseUp = () => {
        setDraggingNode(null);
    };

    const getConnectionPath = (from: Node, to: Node) => {
        const startX = from.x + 220;
        const startY = from.y + 50;
        const endX = to.x;
        const endY = to.y + 50;
        const midX = (startX + endX) / 2;

        return `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'done': return '#22c55e';
            case 'in-progress': return '#f59e0b';
            default: return 'var(--text-tertiary)';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'done': return '완료';
            case 'in-progress': return '진행중';
            default: return '예정';
        }
    };

    const getInitialColor = (name: string) => {
        const colors = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#818cf8', '#e879f9'];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    return (
        <div
            className="min-h-screen flex flex-col"
            style={{ backgroundColor: 'var(--bg-primary)' }}
        >
            {/* Header */}
            <header
                className="h-14 border-b flex items-center justify-between px-6 flex-shrink-0"
                style={{ borderColor: 'var(--border-primary)' }}
            >
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-md transition-colors hover:bg-[var(--bg-secondary)]"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        ← 뒤로
                    </button>
                    <div>
                        <h1
                            className="text-lg font-semibold"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {project.name}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setIsConnecting(!isConnecting);
                            setConnectFrom(null);
                        }}
                        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                            isConnecting ? 'bg-blue-500 text-white' : ''
                        }`}
                        style={!isConnecting ? {
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                        } : {}}
                    >
                        {isConnecting ? '연결 중...' : '🔗 연결'}
                    </button>

                    <button
                        onClick={() => {
                            const newNode: Node = {
                                id: Date.now(),
                                title: '새 작업',
                                status: 'todo',
                                x: 200 + Math.random() * 300,
                                y: 100 + Math.random() * 200,
                                assignees: [],
                            };
                            setNodes([...nodes, newNode]);
                        }}
                        className="px-3 py-1.5 text-sm rounded-md transition-colors"
                        style={{
                            backgroundColor: 'var(--accent)',
                            color: 'var(--bg-primary)',
                        }}
                    >
                        + 노드 추가
                    </button>

                    <button
                        onClick={() => setIsDark(!isDark)}
                        className="p-2 rounded-md transition-colors hover:bg-[var(--bg-secondary)]"
                    >
                        {isDark ? (
                            <svg className="w-4 h-4" fill="none" stroke="var(--text-secondary)" strokeWidth="2" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="5"/>
                                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="var(--text-secondary)" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                            </svg>
                        )}
                    </button>
                </div>
            </header>

            {/* Canvas */}
            <div
                ref={canvasRef}
                className="flex-1 relative overflow-auto cursor-grab active:cursor-grabbing"
                style={{
                    backgroundColor: 'var(--bg-secondary)',
                    backgroundImage: isDark
                        ? 'radial-gradient(circle, #4e4f5b 1px, transparent 1px)'
                        : 'radial-gradient(circle, #d1d1d6 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* 연결선 SVG */}
                <svg
                    className="absolute inset-0 pointer-events-none"
                    style={{ width: '100%', height: '100%', minWidth: '2000px', minHeight: '1000px' }}
                >
                    {connections.map((conn, idx) => {
                        const fromNode = nodes.find(n => n.id === conn.from);
                        const toNode = nodes.find(n => n.id === conn.to);
                        if (!fromNode || !toNode) return null;

                        return (
                            <path
                                key={idx}
                                d={getConnectionPath(fromNode, toNode)}
                                fill="none"
                                stroke={isDark ? '#6e6e80' : '#acacbe'}
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        );
                    })}

                    {isConnecting && connectFrom !== null && (
                        <circle
                            cx={(nodes.find(n => n.id === connectFrom)?.x ?? 0) + 220}
                            cy={(nodes.find(n => n.id === connectFrom)?.y ?? 0) + 50}
                            r="8"
                            fill="#3b82f6"
                            className="animate-pulse"
                        />
                    )}
                </svg>

                {/* 노드들 */}
                {nodes.map(node => (
                    <div
                        key={node.id}
                        className={`absolute w-[220px] rounded-lg border-2 cursor-move select-none transition-shadow ${
                            selectedNode?.id === node.id ? 'shadow-lg' : ''
                        } ${isConnecting ? 'cursor-pointer' : ''}`}
                        style={{
                            left: node.x,
                            top: node.y,
                            backgroundColor: 'var(--bg-primary)',
                            borderColor: selectedNode?.id === node.id
                                ? 'var(--text-primary)'
                                : 'var(--border-primary)',
                        }}
                        onMouseDown={(e) => handleMouseDown(e, node.id)}
                        onClick={() => {
                            if (isConnecting && connectFrom !== null && connectFrom !== node.id) {
                                console.log(`연결: ${connectFrom} → ${node.id}`);
                                setConnectFrom(null);
                                setIsConnecting(false);
                            } else {
                                setSelectedNode(node);
                            }
                        }}
                    >
                        {/* 상태 인디케이터 */}
                        <div
                            className="h-1.5 rounded-t-md"
                            style={{ backgroundColor: getStatusColor(node.status) }}
                        />

                        <div className="p-3">
                            {/* 제목 */}
                            <h3
                                className="font-medium text-sm mb-3"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {node.title}
                            </h3>

                            {/* 담당자 아바타 */}
                            {node.assignees.length > 0 && (
                                <div className="flex items-center gap-1 mb-3">
                                    <div className="flex -space-x-2">
                                        {node.assignees.slice(0, 3).map((assignee, idx) => (
                                            <div
                                                key={assignee.id}
                                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 relative"
                                                style={{
                                                    backgroundColor: getInitialColor(assignee.name),
                                                    borderColor: 'var(--bg-primary)',
                                                    color: 'white',
                                                    zIndex: 3 - idx,
                                                }}
                                                title={assignee.name}
                                            >
                                                {assignee.name.charAt(0)}
                                            </div>
                                        ))}
                                        {node.assignees.length > 3 && (
                                            <div
                                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2"
                                                style={{
                                                    backgroundColor: 'var(--bg-tertiary)',
                                                    borderColor: 'var(--bg-primary)',
                                                    color: 'var(--text-secondary)',
                                                }}
                                            >
                                                +{node.assignees.length - 3}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 메타 */}
                            <div className="flex items-center justify-between">
                <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        color: getStatusColor(node.status),
                    }}
                >
                  {getStatusLabel(node.status)}
                </span>

                                {/* 파일 첨부 버튼 */}
                                <button
                                    className="p-1 rounded transition-colors hover:bg-[var(--bg-secondary)]"
                                    title="파일 첨부"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="var(--text-tertiary)"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* 연결 포인트 */}
                        <div
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 rounded-full border-2"
                            style={{
                                backgroundColor: 'var(--bg-primary)',
                                borderColor: 'var(--border-secondary)',
                            }}
                        />
                        <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2"
                            style={{
                                backgroundColor: 'var(--bg-primary)',
                                borderColor: 'var(--border-secondary)',
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Dock */}
            <Dock
                activeMenu={activeMenu}
                onMenuChange={setActiveMenu}
                editingCards={editingCards}
                members={members}
                showMembers={showMembers}
                setShowMembers={setShowMembers}
            />

            {/* 하단 상태바 */}
            <footer
                className="h-8 border-t flex items-center justify-between px-6 flex-shrink-0"
                style={{ borderColor: 'var(--border-primary)' }}
            >
                <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <span>노드 {nodes.length}개</span>
                    <span>연결 {connections.length}개</span>
                </div>
                <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22c55e' }} /> 완료
          </span>
                    <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#f59e0b' }} /> 진행중
          </span>
                    <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--text-tertiary)' }} /> 예정
          </span>
                </div>
            </footer>
        </div>
    );
}