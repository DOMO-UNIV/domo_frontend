"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dock } from '../dock';
import { NodeCard } from './NodeCard';
import { ConnectionLines } from './ConnectionLine';
import {
    MOCK_NODES,
    MOCK_CONNECTIONS,
    MOCK_MEMBERS,
    MOCK_EDITING_CARDS,
} from '@/lib/api';
import type { Node, Connection, Member, EditingCard, Project } from '@/types';

interface BlueprintBoardProps {
    project: Project;
    onBack: () => void;
}

export function BlueprintBoard({ project, onBack }: BlueprintBoardProps) {
    const [nodes, setNodes] = useState<Node[]>(MOCK_NODES);
    const connections = MOCK_CONNECTIONS;
    const members = MOCK_MEMBERS;
    const editingCards = MOCK_EDITING_CARDS;

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

    const [isConnecting, setIsConnecting] = useState(false);
    const [connectFrom, setConnectFrom] = useState<number | null>(null);

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

    const handleNodeClick = (node: Node) => {
        if (isConnecting && connectFrom !== null && connectFrom !== node.id) {
            console.log(`연결: ${connectFrom} → ${node.id}`);
            setConnectFrom(null);
            setIsConnecting(false);
        } else {
            setSelectedNode(node);
        }
    };

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
            <header className="glass-subtle sticky top-0 z-50">
                <div className="h-14 flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[var(--bg-tertiary)]"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                        </button>
                        <div>
                            <h1
                                className="text-base font-semibold"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {project.name}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleToggleConnect}
                            className={`px-4 py-2 text-sm rounded-xl flex items-center gap-2 ${
                                isConnecting ? 'text-white' : ''
                            }`}
                            style={isConnecting ? {
                                backgroundColor: 'var(--accent)',
                            } : {
                                backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--text-secondary)',
                            }}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                            </svg>
                            {isConnecting ? '연결 중...' : '연결'}
                        </button>

                        <button
                            onClick={handleAddNode}
                            className="px-4 py-2 text-sm rounded-xl flex items-center gap-2 text-white"
                            style={{ backgroundColor: 'var(--accent)' }}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            노드 추가
                        </button>

                        <div className="w-px h-6 mx-1" style={{ backgroundColor: 'var(--border-primary)' }} />

                        <button
                            onClick={() => setIsDark(!isDark)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[var(--bg-tertiary)]"
                        >
                            {isDark ? (
                                <svg className="w-4 h-4" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="5"/>
                                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Canvas */}
            <div
                ref={canvasRef}
                className="flex-1 relative overflow-auto cursor-grab active:cursor-grabbing"
                style={{
                    backgroundColor: 'var(--bg-primary)',
                    backgroundImage: isDark
                        ? 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)'
                        : 'radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <ConnectionLines
                    connections={connections}
                    nodes={nodes}
                    isDark={isDark}
                    isConnecting={isConnecting}
                    connectFrom={connectFrom}
                />

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
                className="h-8 flex items-center justify-between px-6 flex-shrink-0"
                style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    borderTop: '1px solid var(--border-primary)'
                }}
            >
                <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <span>노드 {nodes.length}개</span>
                    <span>연결 {connections.length}개</span>
                </div>
                <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--success)' }} /> 완료
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--warning)' }} /> 진행중
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--text-tertiary)' }} /> 예정
                    </span>
                </div>
            </footer>
        </div>
    );
}
