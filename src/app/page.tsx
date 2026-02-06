'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/src/lib/contexts/UserContext';
import { Loader2 } from 'lucide-react';

export default function Home() {
    const { user, loading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            router.replace(user ? '/workspaces' : '/login');
        }
    }, [user, loading, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        </div>
    );
}
