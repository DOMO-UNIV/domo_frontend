'use client';

import { useRouter } from 'next/navigation';
import { VerifySuccessScreen } from '@/src/containers/screens';

export default function VerifySuccessPage() {
    const router = useRouter();

    return (
        <VerifySuccessScreen
            onGoToLogin={() => router.push('/login')}
        />
    );
}
