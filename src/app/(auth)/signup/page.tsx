'use client';

import { useRouter } from 'next/navigation';
import { SignupScreen } from '@/src/containers/screens';

export default function SignupPage() {
    const router = useRouter();

    return (
        <SignupScreen
            onSignupSuccess={(email: string) => {
                router.push(`/verify?email=${encodeURIComponent(email)}`);
            }}
            onBackToLogin={() => router.push('/login')}
        />
    );
}
