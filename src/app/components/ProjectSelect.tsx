"use client";

import React, { useState, useEffect } from 'react';
import { getMyProjects, logout } from '@/lib/api';
import type { Project, AuthUser } from '@/types';

interface ProjectSelectProps {
    user: AuthUser;
    onSelectProject: (project: Project) => void;
    onLogout: () => void;
}

export function ProjectSelect({ user, onSelectProject, onLogout }: ProjectSelectProps) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDark, setIsDark] = useState(() => {
        if (typeof window === 'undefined') return true;
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
    }, [isDark]);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const data = await getMyProjects();
            setProjects(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        onLogout();
    };

    return (
        <div
            className="min-h-screen relative"
            style={{ backgroundColor: 'var(--bg-primary)' }}
        >
            {/* 배경 그라데이션 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div 
                    className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
                    style={{ background: isDark ? 'radial-gradient(circle, #1a1a2e 0%, transparent 70%)' : 'radial-gradient(circle, #e8e8ed 0%, transparent 70%)' }}
                />
            </div>

            {/* Header */}
            <header className="glass-subtle sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <h1
                        className="text-xl font-semibold tracking-tight"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        Domo
                    </h1>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsDark(!isDark)}
                            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--bg-tertiary)]"
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

                        <div 
                            className="h-5 w-px"
                            style={{ backgroundColor: 'var(--border-primary)' }}
                        />

                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {user.name}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="text-sm px-3 py-1.5 rounded-lg hover:bg-[var(--bg-tertiary)]"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            로그아웃
                        </button>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="max-w-6xl mx-auto px-6 py-12 relative z-10">
                <div className="mb-10">
                    <h2
                        className="text-3xl font-semibold mb-2 tracking-tight"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        워크스페이스
                    </h2>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        프로젝트를 선택하여 작업을 시작하세요
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <svg className="w-8 h-8 animate-spin" style={{ color: 'var(--text-tertiary)' }} viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {projects.map(project => (
                            <div
                                key={project.id}
                                onClick={() => onSelectProject(project)}
                                className="glass rounded-2xl p-5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] group"
                            >
                                {/* 상단: 역할 & 워크스페이스 */}
                                <div className="flex items-center justify-between mb-4">
                                    <span
                                        className="text-xs px-2.5 py-1 rounded-full"
                                        style={{
                                            backgroundColor: 'var(--bg-tertiary)',
                                            color: 'var(--text-secondary)',
                                        }}
                                    >
                                        {project.role}
                                    </span>
                                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                        {project.workspace}
                                    </span>
                                </div>

                                {/* 프로젝트명 */}
                                <h3
                                    className="text-lg font-semibold mb-4 group-hover:text-[var(--accent)] transition-colors"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    {project.name}
                                </h3>

                                {/* 진행률 */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between text-xs mb-2">
                                        <span style={{ color: 'var(--text-tertiary)' }}>진행률</span>
                                        <span style={{ color: 'var(--text-primary)' }}>{project.progress}%</span>
                                    </div>
                                    <div
                                        className="h-1 rounded-full overflow-hidden"
                                        style={{ backgroundColor: 'var(--bg-tertiary)' }}
                                    >
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${project.progress}%`,
                                                backgroundColor: project.progress === 100 ? 'var(--success)' : 'var(--accent)',
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* 메타 정보 */}
                                <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    <span className="flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                        </svg>
                                        {project.memberCount}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {project.lastActivity}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {/* 새 프로젝트 추가 */}
                        <div
                            className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)] transition-all group"
                            style={{
                                borderColor: 'var(--border-primary)',
                                minHeight: '200px',
                            }}
                        >
                            <div 
                                className="w-12 h-12 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                            </div>
                            <span className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                                새 프로젝트
                            </span>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
