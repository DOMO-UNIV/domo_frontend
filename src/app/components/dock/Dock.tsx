"use client";

import React from 'react';
import { DockButton } from './DockButton';
import type { Member, EditingCard } from '@/types';

interface DockProps {
  activeMenu: string;
  onMenuChange: (menu: string) => void;
  editingCards: EditingCard[];
  members: Member[];
  showMembers: boolean;
  setShowMembers: (show: boolean) => void;
}

export function Dock({
  activeMenu,
  onMenuChange,
  editingCards,
  members,
  showMembers,
  setShowMembers,
}: DockProps) {
  const onlineCount = members.filter(m => m.isOnline).length;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-2.5 glass rounded-2xl">
      {/* 메뉴 버튼들 */}
      <div className="flex items-center gap-1">
        <DockButton
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          }
          label="대시보드"
          isActive={activeMenu === 'dashboard'}
          onClick={() => onMenuChange('dashboard')}
        />
        <DockButton
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          }
          label="파일"
          isActive={activeMenu === 'files'}
          onClick={() => onMenuChange('files')}
        />
        <DockButton
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          }
          label="마이페이지"
          isActive={activeMenu === 'mypage'}
          onClick={() => onMenuChange('mypage')}
        />
      </div>

      {/* 구분선 */}
      <div className="w-px h-8 mx-2" style={{ backgroundColor: 'var(--border-primary)' }} />

      {/* 온라인 멤버 */}
      <div
        className="relative"
        onMouseEnter={() => setShowMembers(true)}
        onMouseLeave={() => setShowMembers(false)}
      >
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[var(--bg-tertiary)]">
          <span className="relative flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
            <span className="absolute w-2 h-2 rounded-full bg-[var(--success)] animate-ping" />
          </span>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {onlineCount}
          </span>
        </button>

        {/* 멤버 목록 팝업 */}
        {showMembers && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 glass rounded-2xl">
            <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-tertiary)' }}>
              팀 멤버
            </p>
            <div className="space-y-2.5">
              {members.map(member => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium"
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {member.name.charAt(0)}
                    </div>
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                      style={{ 
                        backgroundColor: member.isOnline ? 'var(--success)' : 'var(--text-tertiary)',
                        borderColor: 'var(--bg-primary)'
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {member.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                      {member.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 수정중인 카드 */}
      {editingCards.length > 0 && (
        <>
          <div className="w-px h-8 mx-2" style={{ backgroundColor: 'var(--border-primary)' }} />
          <div className="flex items-center gap-2">
            {editingCards.map(card => (
              <div
                key={card.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <span className="relative flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--warning)' }} />
                  <span className="absolute w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: 'var(--warning)' }} />
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {card.user}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
