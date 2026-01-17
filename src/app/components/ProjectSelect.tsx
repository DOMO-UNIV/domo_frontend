"use client";

import React, { useState, useEffect } from 'react';

// ============================================
// API 설정
// ============================================
const API_CONFIG = {
    BASE_URL: 'http://localhost:8000/api',
    USE_MOCK: true,
};

const MOCK_PROJECTS = [
    {
        id: 1,
        name: 'Domo 협업 플랫폼',
        workspace: '캡스톤디자인',
        role: 'PM',
        progress: 65,
        memberCount: 4,
        lastActivity: '2분 전',
        color: '#FEF3C7', // yellow
    },
    {
        id: 2,
        name: 'API 문서 작성',
        workspace: '캡스톤디자인',
        role: 'Frontend',
        progress: 30,
        memberCount: 4,
        lastActivity: '1시간 전',
        color: '#DBEAFE', // blue
    },
    {
        id: 3,
        name: '요구사항 분석',
        workspace: '소프트웨어공학',
        role: 'Researcher',
        progress: 100,
        memberCount: 3,
        lastActivity: '1일 전',
        color: '#FCE7F3', // pink
    },
];

const api = {
    getMyProjects: async () => {
        if (API_CONFIG.USE_MOCK) {
            await new Promise(r => setTimeout(r, 400));
            return MOCK_PROJECTS;
        }
        const res = await fetch(`${API_CONFIG.BASE_URL}/workspaces`, {
            credentials: 'include',
        });
        if (!res.ok) throw new Error('프로젝트 조회 실패');
        const workspaces = await res.json();
        // 모든 워크스페이스의 프로젝트를 합침
        const allProjects: typeof MOCK_PROJECTS = [];
        for (const ws of workspaces) {
            const projRes = await fetch(`${API_CONFIG.BASE_URL}/workspaces/${ws.id}/projects`, {
                credentials: 'include',
            });
            if (projRes.ok) {
                const projects = await projRes.json();
                projects.forEach((p: { id: number; name: string }) => {
                    allProjects.push({
                        ...p,
                        workspace: ws.name,
                        role: 'Member',
                        progress: 0,
                        memberCount: 0,
                        lastActivity: '-',
                        color: '#F3F4F6',
                    });
                });
            }
        }
        return allProjects;
    },

    logout: async () => {
        if (API_CONFIG.USE_MOCK) {
            await new Promise(r => setTimeout(r, 200));
            return { message: '로그아웃' };
        }
        const res = await fetch(`${API_CONFIG.BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });
        return res.json();
    },
};

// ============================================
// 타입
// ============================================
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

interface ProjectSelectProps {
    user: { email: string; name: string };
    onSelectProject: (project: Project) => void;
    onLogout: () => void;
}

// ============================================
// 컴포넌트
// ============================================
export function ProjectSelect({ user, onSelectProject, onLogout }: ProjectSelectProps) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDark(prefersDark);
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
    }, [isDark]);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const data = await api.getMyProjects();
            setProjects(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await api.logout();
        onLogout();
    };

    return (
        <div
            className="min-h-screen"
            style={{ backgroundColor: 'var(--bg-primary)' }}
        >
            {/* Header */}
            <header
                className="h-14 border-b flex items-center justify-between px-6"
                style={{ borderColor: 'var(--border-primary)' }}
            >
                <h1
                    className="text-lg font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                >
                    Domo
                </h1>

                <div className="flex items-center gap-4">
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

                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {user.name}
          </span>
                    <button
                        onClick={handleLogout}
                        className="text-sm px-3 py-1.5 rounded-md transition-colors hover:bg-[var(--bg-secondary)]"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        로그아웃
                    </button>
                </div>
            </header>

            {/* Main */}
            <main className="max-w-5xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <h2
                        className="text-2xl font-semibold mb-2"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        My Workspace
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        프로젝트를 선택하여 타임라인을 확인하세요
                    </p>
                </div>

                {isLoading ? (
                    <p style={{ color: 'var(--text-tertiary)' }}>로딩 중...</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {projects.map(project => (
                            <div
                                key={project.id}
                                onClick={() => onSelectProject(project)}
                                className="relative rounded-xl cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg"
                                style={{
                                    backgroundColor: isDark ? 'var(--bg-secondary)' : project.color,
                                }}
                            >
                                {/* 역할 태그 */}
                                <div className="absolute top-4 left-4">
                  <span
                      className="text-xs px-2 py-1 rounded-md"
                      style={{
                          backgroundColor: isDark ? 'var(--bg-tertiary)' : 'rgba(0,0,0,0.1)',
                          color: 'var(--text-secondary)',
                      }}
                  >
                    {project.role}
                  </span>
                                </div>

                                <div className="p-5 pt-12">
                                    <h3
                                        className="text-lg font-semibold mb-4"
                                        style={{ color: 'var(--text-primary)' }}
                                    >
                                        {project.name}
                                    </h3>

                                    {/* 진행률 */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between text-xs mb-1.5">
                                            <span style={{ color: 'var(--text-secondary)' }}>Progress</span>
                                            <span style={{ color: 'var(--text-primary)' }}>{project.progress}%</span>
                                        </div>
                                        <div
                                            className="h-1.5 rounded-full overflow-hidden"
                                            style={{ backgroundColor: isDark ? 'var(--bg-tertiary)' : 'rgba(0,0,0,0.1)' }}
                                        >
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${project.progress}%`,
                                                    backgroundColor: isDark ? 'var(--text-primary)' : 'var(--text-primary)',
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* 메타 */}
                                    <div className="flex items-center justify-between text-xs">
                    <span style={{ color: 'var(--text-tertiary)' }}>
                      👥 {project.memberCount}
                    </span>
                                        <span style={{ color: 'var(--text-tertiary)' }}>
                      🕐 {project.lastActivity}
                    </span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* 새 프로젝트 */}
                        <div
                            className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-[var(--border-secondary)]"
                            style={{
                                borderColor: 'var(--border-primary)',
                                minHeight: '180px',
                            }}
                        >
              <span
                  className="text-3xl mb-2"
                  style={{ color: 'var(--text-tertiary)' }}
              >
                +
              </span>
                            <span
                                className="text-sm"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                New Project
              </span>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}