'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/src/lib/contexts/UserContext';
import { LoginScreen } from '@/src/containers/screens';

export default function LoginPage() {
    const router = useRouter();
    const { refreshUser } = useUser();

    return (
        <LoginScreen
            onLoginSuccess={async () => {
                await refreshUser();
                router.push('/workspaces');
            }}
            onGoToSignup={() => router.push('/signup')}
        />
    );
}
