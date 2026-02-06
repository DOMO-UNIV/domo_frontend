'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/src/lib/contexts/UserContext';
import { WorkspaceListScreen } from '@/src/containers/screens';
import { logout } from '@/src/models/api';
import type { Workspace } from '@/src/models/types';

export default function WorkspacesPage() {
    const router = useRouter();
    const { user, clearUser } = useUser();

    if (!user) return null;

    return (
        <WorkspaceListScreen
            user={user}
            onSelectWorkspace={(workspace: Workspace) => {
                router.push(`/workspaces/${workspace.id}`);
            }}
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
