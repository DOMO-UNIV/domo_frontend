"use client";

import React from 'react';

interface DockButtonProps {
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export function DockButton({ icon, label, isActive, onClick }: DockButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${
        isActive ? 'bg-[var(--bg-tertiary)]' : 'hover:bg-[var(--bg-secondary)]'
      }`}
    >
      <span className="text-xl">{icon}</span>

      {/* 툴팁 */}
      <span
        className="absolute bottom-full mb-2 px-2 py-1 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
        style={{
          backgroundColor: 'var(--bg-tertiary)',
          color: 'var(--text-primary)',
        }}
      >
        {label}
      </span>
    </button>
  );
}
