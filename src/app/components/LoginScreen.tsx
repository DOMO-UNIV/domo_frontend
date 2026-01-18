"use client";

import React, { useState, useEffect } from 'react';
import { login, signup, verify, API_CONFIG } from '@/lib/api';
import type { AuthUser } from '@/types';

interface LoginScreenProps {
    onLoginSuccess?: (user: AuthUser) => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
    const [view, setView] = useState<'login' | 'signup' | 'verify'>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ email: '', password: '', name: '', code: '' });
    const [isDark, setIsDark] = useState(() => {
        if (typeof window === 'undefined') return true;
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
    }, [isDark]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const result = await login(form.email, form.password);
            onLoginSuccess?.(result.user);
        } catch (err) {
            setError(err instanceof Error ? err.message : '로그인 실패');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await signup(form.email, form.password, form.name);
            setView('verify');
        } catch (err) {
            setError(err instanceof Error ? err.message : '회원가입 실패');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await verify(form.email, form.code);
            setView('login');
            setForm(f => ({ ...f, password: '', code: '' }));
        } catch (err) {
            setError(err instanceof Error ? err.message : '인증 실패');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div 
            className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
            style={{ backgroundColor: 'var(--bg-primary)' }}
        >
            {/* 배경 그라데이션 블롭 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div 
                    className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-30 blur-3xl"
                    style={{ background: isDark ? 'radial-gradient(circle, #1a1a2e 0%, transparent 70%)' : 'radial-gradient(circle, #e8e8ed 0%, transparent 70%)' }}
                />
                <div 
                    className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-30 blur-3xl"
                    style={{ background: isDark ? 'radial-gradient(circle, #1a1a2e 0%, transparent 70%)' : 'radial-gradient(circle, #e8e8ed 0%, transparent 70%)' }}
                />
            </div>

            {/* 다크모드 토글 */}
            <button
                onClick={() => setIsDark(!isDark)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center glass hover:scale-105 active:scale-95"
                aria-label="Toggle theme"
            >
                {isDark ? (
                    <svg className="w-5 h-5" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="5"/>
                        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                    </svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                    </svg>
                )}
            </button>

            {/* 메인 카드 */}
            <div className="w-full max-w-[380px] glass rounded-3xl p-8 relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1
                        className="text-4xl font-semibold tracking-tight"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        Domo
                    </h1>
                    <p
                        className="text-sm mt-2 font-light"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        팀프로젝트 협업 플랫폼
                    </p>
                </div>

                {/* Login Form */}
                {view === 'login' && (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-3">
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="학교 이메일"
                                className="w-full h-12 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                style={{
                                    backgroundColor: 'var(--bg-tertiary)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-primary)',
                                }}
                                required
                            />
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="비밀번호"
                                className="w-full h-12 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                style={{
                                    backgroundColor: 'var(--bg-tertiary)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-primary)',
                                }}
                                required
                            />
                        </div>

                        {error && (
                            <p className="text-sm px-1" style={{ color: 'var(--error)' }}>{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 rounded-xl text-sm font-medium text-white disabled:opacity-50 hover:opacity-90 active:scale-[0.98]"
                            style={{ backgroundColor: 'var(--accent)' }}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                    </svg>
                                    로그인 중...
                                </span>
                            ) : '로그인'}
                        </button>

                        <div className="flex items-center gap-4 my-6">
                            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-primary)' }} />
                            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>또는</span>
                            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-primary)' }} />
                        </div>

                        <button
                            type="button"
                            disabled
                            className="w-full h-12 rounded-xl text-sm font-medium disabled:opacity-40"
                            style={{
                                backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-primary)',
                            }}
                        >
                            카카오로 계속하기 (준비중)
                        </button>

                        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
                            계정이 없으신가요?{' '}
                            <button
                                type="button"
                                onClick={() => { setView('signup'); setError(''); }}
                                className="font-medium hover:underline"
                                style={{ color: 'var(--accent)' }}
                            >
                                회원가입
                            </button>
                        </p>
                    </form>
                )}

                {/* Signup Form */}
                {view === 'signup' && (
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-3">
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="이름"
                                className="w-full h-12 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                style={{
                                    backgroundColor: 'var(--bg-tertiary)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-primary)',
                                }}
                                required
                            />
                            <div>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="학교 이메일"
                                    className="w-full h-12 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                    style={{
                                        backgroundColor: 'var(--bg-tertiary)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--border-primary)',
                                    }}
                                    required
                                />
                                <p className="text-xs mt-1.5 ml-1" style={{ color: 'var(--text-tertiary)' }}>
                                    @jj.ac.kr 이메일만 가능
                                </p>
                            </div>
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="비밀번호 (8자 이상)"
                                minLength={8}
                                className="w-full h-12 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                style={{
                                    backgroundColor: 'var(--bg-tertiary)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-primary)',
                                }}
                                required
                            />
                        </div>

                        {error && (
                            <p className="text-sm px-1" style={{ color: 'var(--error)' }}>{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 rounded-xl text-sm font-medium text-white disabled:opacity-50 hover:opacity-90 active:scale-[0.98]"
                            style={{ backgroundColor: 'var(--accent)' }}
                        >
                            {isLoading ? '처리 중...' : '회원가입'}
                        </button>

                        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
                            이미 계정이 있으신가요?{' '}
                            <button
                                type="button"
                                onClick={() => { setView('login'); setError(''); }}
                                className="font-medium hover:underline"
                                style={{ color: 'var(--accent)' }}
                            >
                                로그인
                            </button>
                        </p>
                    </form>
                )}

                {/* Verify Form */}
                {view === 'verify' && (
                    <form onSubmit={handleVerify} className="space-y-4">
                        <div className="text-center mb-6">
                            <div 
                                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                            >
                                <svg className="w-8 h-8" fill="none" stroke="var(--accent)" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                인증 메일을 발송했습니다
                            </p>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                {form.email}
                            </p>
                        </div>

                        <input
                            type="text"
                            name="code"
                            value={form.code}
                            onChange={handleChange}
                            placeholder="인증 코드 6자리"
                            maxLength={6}
                            className="w-full h-14 px-4 rounded-xl text-lg text-center tracking-[0.5em] outline-none font-mono focus:ring-2 focus:ring-[var(--accent)]"
                            style={{
                                backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-primary)',
                            }}
                            required
                        />

                        {error && (
                            <p className="text-sm px-1" style={{ color: 'var(--error)' }}>{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 rounded-xl text-sm font-medium text-white disabled:opacity-50 hover:opacity-90 active:scale-[0.98]"
                            style={{ backgroundColor: 'var(--accent)' }}
                        >
                            {isLoading ? '확인 중...' : '인증 완료'}
                        </button>

                        <button
                            type="button"
                            onClick={() => { setView('signup'); setError(''); }}
                            className="w-full text-sm py-2 hover:underline"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            ← 뒤로
                        </button>
                    </form>
                )}

                {/* Dev Info */}
                {API_CONFIG.USE_MOCK && (
                    <div
                        className="mt-8 pt-6 text-center"
                        style={{ borderTop: '1px solid var(--border-primary)' }}
                    >
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            테스트: student@jj.ac.kr / test1234
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                            인증코드: 123456
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
