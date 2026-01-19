
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dock } from '../dock';
import { NodeCard } from './NodeCard';
import { ConnectionLines } from './ConnectionLine';
import { GeminiHub } from '../gemini/GeminiHub';
import {
    MOCK_NODES,
    MOCK_CONNECTIONS,
    MOCK_MEMBERS,
    MOCK_EDITING_CARDS,
} from '../../../lib/api/index';
import type { Node, Connection, Member, EditingCard, Project } from '../../../types/index';

// ============================================
// 메인 컴포넌트
// ============================================
interface BlueprintBoardProps {
    project: Project;
    onBack: () => void;
}

export function BlueprintBoard({ project, onBack }: BlueprintBoardProps) {
    // 상태
    const [nodes, setNodes] = useState<Node[]>(MOCK_NODES);
    const [connections] = useState<Connection[]>(MOCK_CONNECTIONS);
    const [members] = useState<Member[]>(MOCK_MEMBERS);
    const [editingCards] = useState<EditingCard[]>(MOCK_EDITING_CARDS);

    const [isDark, setIsDark] = useState(() => {
        if (typeof window === 'undefined') return true;
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [draggingNode, setDraggingNode] = useState<number | null>(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [activeMenu, setActiveMenu] = useState('dashboard');
    const [showMembers, setShowMembers] = useState(false);
    const canvasRef = useRef<HTMLDivElement>(null);

    // 연결 모드 상태
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectFrom, setConnectFrom] = useState<number | null>(null);

    // 다크모드 적용
    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
    }, [isDark]);

    // 드래그 핸들러
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

    // 노드 클릭 핸들러
    const handleNodeClick = (node: Node) => {
        if (isConnecting && connectFrom !== null && connectFrom !== node.id) {
            console.log(`연결: ${connectFrom} → ${node.id}`);
            setConnectFrom(null);
            setIsConnecting(false);
        } else {
            setSelectedNode(node);
        }
    };

    // 새 노드 추가
    const handleAddNode = () => {
        const newNode: Node = {
            id: Date.now(),
            title: '새 작업',
            status: 'todo',
            x: 200 + Math.random() * 300,
            y: 100 + Math.random() * 200,
            assignees: [],
        };
        setNodes([...nodes, newNode]);
    };

    // 연결 모드 토글
    const handleToggleConnect = () => {
        setIsConnecting(!isConnecting);
        setConnectFrom(null);
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
                        onClick={handleToggleConnect}
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
                        onClick={handleAddNode}
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
                {/* 연결선 */}
                <ConnectionLines
                    connections={connections}
                    nodes={nodes}
                    isDark={isDark}
                    isConnecting={isConnecting}
                    connectFrom={connectFrom}
                />

                {/* 노드들 */}
                {nodes.map(node => (
                    <NodeCard
                        key={node.id}
                        node={node}
                        isSelected={selectedNode?.id === node.id}
                        isConnecting={isConnecting}
                        onMouseDown={handleMouseDown}
                        onClick={() => handleNodeClick(node)}
                    />
                ))}
            </div>

            {/* Gemini Hub Overlay */}
            {activeMenu === 'gemini' && (
                <GeminiHub onClose={() => setActiveMenu('dashboard')} />
            )}

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
