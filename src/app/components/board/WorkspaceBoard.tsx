'use client';

import React, { useState, useEffect } from 'react';
import { Project, Task, Connection, Board, Group, ViewMode, AuthUser } from '@/src/types';
import { BoardCanvas } from './BoardCanvas';
import { CalendarView, TimelineView, SettingsView } from './Views';
import { TaskDetailModal } from '../ui/TaskDetailModal';
import { Mascot } from '../ui/Mascot';

import {
    getTasks,
    getConnections,
    createTask,
    updateTask,
    createConnection,
    deleteConnection
} from '@/src/lib/api';

import {
    Trello, Calendar as CalendarIcon, StretchHorizontal, Settings,
    ChevronLeft, ChevronRight, ArrowLeft, Loader2
} from 'lucide-react';

interface WorkspaceBoardProps {
    project: Project;
    onBack: () => void;
    user: AuthUser;
    onLogout: () => void;
}

export const WorkspaceBoard: React.FC<WorkspaceBoardProps> = ({ project, onBack, user, onLogout }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [boards, setBoards] = useState<Board[]>([{ id: 1, title: '메인 보드' }]);
    const [activeBoardId, setActiveBoardId] = useState<number>(1);
    const [groups, setGroups] = useState<Group[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('board');
    const [settingsTab, setSettingsTab] = useState<'profile' | 'preferences'>('profile');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [snapToGrid, setSnapToGrid] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // 로딩 & 에러 상태
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 프로젝트 데이터 로드
    useEffect(() => {
        const loadProjectData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const [tasksData, connectionsData] = await Promise.all([
                    getTasks(project.id),
                    getConnections(project.id),
                ]);

                setTasks(tasksData);
                setConnections(connectionsData);
            } catch (err) {
                console.error('Failed to load project data:', err);
                setError('프로젝트 데이터를 불러오는데 실패했습니다.');
            } finally {
                setIsLoading(false);
            }
        };

        loadProjectData();
    }, [project.id]);

    const handleBoardTasksUpdate = (boardTasks: Task[]) => {
        setTasks(prev => {
            const other = prev.filter(t => t.boardId !== activeBoardId);
            return [...other, ...boardTasks];
        });
    };

    // 태스크 생성 핸들러
    const handleTaskCreate = async (taskData: Partial<Task>) => {
        const columnId = taskData.column_id || 1;

        // 필수 필드들을 명시적으로 설정
        const newTaskData: Omit<Task, 'id'> = {
            title: taskData.title || '새로운 카드',
            status: taskData.status || 'todo',
            x: taskData.x ?? 100,
            y: taskData.y ?? 100,
            boardId: activeBoardId,
            description: taskData.description,
            content: taskData.content,
            column_id: columnId,
            taskType: taskData.taskType,
            card_type: taskData.card_type,
            time: taskData.time,
            start_date: taskData.start_date,
            due_date: taskData.due_date,
            color: taskData.color,
            tags: taskData.tags || [],
            comments: taskData.comments || [],
            files: taskData.files || [],
            assignees: taskData.assignees || [],
        };

        try {
            const newTask = await createTask(columnId, newTaskData);
            setTasks(prev => [...prev, newTask]);
            return newTask;
        } catch (err) {
            console.error('Failed to create task:', err);
            throw err;
        }
    };

    // 태스크 업데이트 핸들러
    const handleTaskUpdate = async (taskId: number, updates: Partial<Task>) => {
        // 낙관적 업데이트
        const previousTasks = [...tasks];
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));

        try {
            await updateTask(taskId, updates);
        } catch (err) {
            console.error('Failed to update task:', err);
            // 롤백
            setTasks(previousTasks);
            throw err;
        }
    };

    // 연결선 생성 핸들러
    const handleConnectionCreate = async (from: number, to: number) => {
        const newConnection: Omit<Connection, 'id'> = {
            from,
            to,
            boardId: activeBoardId,
            style: 'solid',
            shape: 'bezier'
        };

        // 낙관적 업데이트
        const tempId = Date.now();
        setConnections(prev => [...prev, { ...newConnection, id: tempId }]);

        try {
            const savedConnection = await createConnection(project.id, newConnection);
            setConnections(prev =>
                prev.map(c => c.id === tempId ? savedConnection : c)
            );
        } catch (err) {
            console.error('Failed to create connection:', err);
            // 롤백
            setConnections(prev => prev.filter(c => c.id !== tempId));
        }
    };

    // 연결선 삭제 핸들러
    const handleConnectionDelete = async (connectionId: number) => {
        const previousConnections = [...connections];
        setConnections(prev => prev.filter(c => c.id !== connectionId));

        try {
            await deleteConnection(project.id, connectionId);
        } catch (err) {
            console.error('Failed to delete connection:', err);
            setConnections(previousConnections);
        }
    };

    // 로딩 화면
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-black">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    <p className="text-gray-500 dark:text-gray-400">프로젝트 로딩 중...</p>
                </div>
            </div>
        );
    }

    // 에러 화면
    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-black">
                <div className="flex flex-col items-center gap-4 text-center">
                    <p className="text-red-500">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 font-sans overflow-hidden">
            {/* Background Ambiance */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-400/5 dark:bg-blue-900/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-400/5 dark:bg-purple-900/10 rounded-full blur-[120px]"></div>
            </div>

            {/* Floating Sidebar */}
            <div className={`relative z-20 py-4 pl-4 transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] ${sidebarOpen ? 'w-72' : 'w-20'}`}>
                <div className="glass-panel h-full rounded-[2rem] flex flex-col border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden">
                    <div className="p-6 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <div className={`flex items-center gap-3 font-bold text-xl text-gray-900 dark:text-white ${!sidebarOpen && 'hidden'} transition-opacity duration-200`}>
                                <Mascot size={32} />
                                <span className="tracking-tight">DOMO</span>
                            </div>
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className={`p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-gray-500 transition-colors ${!sidebarOpen && 'mx-auto'}`}
                            >
                                {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                            </button>
                        </div>

                        {sidebarOpen && (
                            <button
                                onClick={onBack}
                                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors px-1 group"
                            >
                                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                <span>Back to Projects</span>
                            </button>
                        )}
                    </div>

                    {sidebarOpen && (
                        <div className="px-6 pb-6 animate-in fade-in slide-in-from-left-4 duration-300">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Current Project</div>
                            <div className="p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-white/20 shadow-sm backdrop-blur-sm">
                                <div className="font-bold text-lg truncate mb-1" title={project.name}>{project.name}</div>
                                <div className="text-xs text-gray-500 font-medium">{project.workspace}</div>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto px-4 space-y-1">
                        <button onClick={() => setViewMode('board')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 ${viewMode === 'board' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'}`}>
                            <Trello size={20} strokeWidth={viewMode === 'board' ? 2.5 : 2} />
                            {sidebarOpen && <span className="font-medium">Board</span>}
                        </button>
                        <button onClick={() => setViewMode('calendar')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 ${viewMode === 'calendar' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'}`}>
                            <CalendarIcon size={20} strokeWidth={viewMode === 'calendar' ? 2.5 : 2} />
                            {sidebarOpen && <span className="font-medium">Calendar</span>}
                        </button>
                        <button onClick={() => setViewMode('timeline')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 ${viewMode === 'timeline' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'}`}>
                            <StretchHorizontal size={20} strokeWidth={viewMode === 'timeline' ? 2.5 : 2} />
                            {sidebarOpen && <span className="font-medium">Timeline</span>}
                        </button>
                    </div>

                    <div className="p-4 mt-auto">
                        <button onClick={() => setViewMode('settings')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${viewMode === 'settings' ? 'bg-gray-200 dark:bg-white/10 font-bold text-gray-900 dark:text-white' : ''}`}>
                            <Settings size={20} />
                            {sidebarOpen && <span>Settings</span>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full relative overflow-hidden z-10 p-4">
                <div className="bg-white/40 dark:bg-black/40 backdrop-blur-3xl rounded-[2rem] border border-white/20 dark:border-white/5 shadow-inner h-full overflow-hidden relative">
                    {viewMode === 'board' && (
                        <BoardCanvas
                            tasks={tasks.filter(t => t.boardId === activeBoardId)}
                            connections={connections.filter(c => c.boardId === activeBoardId)}
                            onTasksUpdate={handleBoardTasksUpdate}
                            onTaskSelect={setSelectedTask}
                            onTaskCreate={handleTaskCreate}
                            onTaskUpdate={handleTaskUpdate}
                            onConnectionCreate={handleConnectionCreate}
                            onConnectionDelete={handleConnectionDelete}
                            onConnectionUpdate={(id, updates) => setConnections(connections.map(c => c.id === id ? { ...c, ...updates } : c))}
                            boards={boards}
                            activeBoardId={activeBoardId}
                            onSwitchBoard={setActiveBoardId}
                            onAddBoard={(name) => {
                                const newId = Date.now();
                                setBoards([...boards, { id: newId, title: name }]);
                                setActiveBoardId(newId);
                            }}
                            onRenameBoard={(id, name) => setBoards(boards.map(b => b.id === id ? { ...b, title: name } : b))}
                            snapToGrid={snapToGrid}
                            groups={groups.filter(g => g.boardId === activeBoardId)}
                            onGroupsUpdate={(updatedGroups) => {
                                setGroups(prev => {
                                    const otherGroups = prev.filter(g => g.boardId !== activeBoardId);
                                    return [...otherGroups, ...updatedGroups];
                                });
                            }}
                            onToggleGrid={() => setSnapToGrid(!snapToGrid)}
                            onToggleTheme={() => document.documentElement.classList.toggle('dark')}
                            user={user}
                            onLogout={onLogout}
                            onOpenSettings={(tab) => {
                                if (tab) setSettingsTab(tab);
                                setViewMode('settings');
                            }}
                        />
                    )}
                    {viewMode === 'calendar' && <CalendarView tasks={tasks} onTaskSelect={setSelectedTask} />}
                    {viewMode === 'timeline' && <TimelineView tasks={tasks} onTaskSelect={setSelectedTask} />}
                    {viewMode === 'settings' && <SettingsView initialTab={settingsTab} />}
                </div>
            </div>

            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={(updated) => {
                        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
                        setSelectedTask(updated);
                    }}
                    currentUser="User"
                />
            )}
        </div>
    );
}

export default WorkspaceBoard;