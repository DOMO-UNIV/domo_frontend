'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@/src/lib/contexts/UserContext';
import { ProjectSelectScreen } from '@/src/containers/screens';
import { getWorkspace, logout } from '@/src/models/api';
import { Loader2 } from 'lucide-react';
import type { Workspace, Project } from '@/src/models/types';

export default function WorkspaceDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { user, clearUser } = useUser();

    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const workspaceId = Number(params.workspaceId);

    useEffect(() => {
        if (isNaN(workspaceId)) {
            router.replace('/workspaces');
            return;
        }

        setLoading(true);
        setError(null);
        getWorkspace(workspaceId)
            .then(setWorkspace)
            .catch((err) => {
                console.error('Failed to fetch workspace:', err);
                setError(err instanceof Error ? err.message : '워크스페이스를 불러오지 못했습니다.');
            })
            .finally(() => setLoading(false));
    }, [workspaceId, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-black gap-4">
                <p className="text-red-500">{error}</p>
                <button
                    onClick={() => router.replace('/workspaces')}
                    className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                >
                    워크스페이스 목록으로 돌아가기
                </button>
            </div>
        );
    }

    if (!workspace || !user) return null;

    return (
        <ProjectSelectScreen
            workspace={workspace}
            user={user}
            onSelectProject={(project: Project) => {
                router.push(`/workspaces/${workspaceId}/projects/${project.id}`);
            }}
            onBack={() => router.push('/workspaces')}
            onLogout={async () => {
                try {
                    await logout();
                } catch (e) {
                    console.error('Logout failed:', e);
                }
                clearUser();
                router.push('/login');
            }}
        />
    );
}
