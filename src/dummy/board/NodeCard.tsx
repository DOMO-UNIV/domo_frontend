
"use client";

import React from 'react';
import type { Node, Assignee } from '../../../types/index';

interface NodeCardProps {
  node: Node;
  isSelected: boolean;
  isConnecting: boolean;
  onMouseDown: (e: React.MouseEvent, nodeId: number) => void;
  onClick: () => void;
}

// 상태별 색상 (Apple Style Pastels)
function getStatusColor(status: string): string {
  switch (status) {
    case 'done': return '#34c759'; // Apple Green
    case 'in-progress': return '#ff9f0a'; // Apple Orange
    default: return '#aeaeb2'; // Apple Gray
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'done': return '완료';
    case 'in-progress': return '진행중';
    default: return '예정';
  }
}

// 이름 기반 색상 생성 (Soft Gradients)
function getInitialColor(name: string): string {
  const colors = [
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export function NodeCard({
  node,
  isSelected,
  isConnecting,
  onMouseDown,
  onClick,
}: NodeCardProps) {
  return (
    <div
      className={`absolute w-[240px] rounded-3xl cursor-move select-none transition-all duration-300 group ${
        isSelected ? 'scale-105 z-20' : 'z-10'
      } ${isConnecting ? 'cursor-pointer' : ''}`}
      style={{
        left: node.x,
        top: node.y,
        // Glassmorphism: visionOS Style
        background: 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(20px) saturate(150%)',
        WebkitBackdropFilter: 'blur(20px) saturate(150%)',
        border: isSelected ? '1px solid #0071e3' : '1px solid rgba(255, 255, 255, 0.6)',
        boxShadow: isSelected 
            ? '0 20px 40px -10px rgba(0, 113, 227, 0.3), 0 0 0 1px rgba(0, 113, 227, 0.5)' 
            : '0 8px 24px -6px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
      }}
      onMouseDown={(e) => onMouseDown(e, node.id)}
      onClick={onClick}
    >
        {/* Dark Mode Overrides inline for specific glass effect adjustment */}
        <div className="dark:bg-[#1c1c1e]/80 dark:text-white rounded-3xl h-full w-full overflow-hidden relative">
            
          {/* 상태 인디케이터 - Top Bar Glow */}
          <div
            className="absolute top-0 left-0 right-0 h-1.5 opacity-80"
            style={{ 
                background: getStatusColor(node.status),
                boxShadow: `0 2px 10px ${getStatusColor(node.status)}` 
            }}
          />

          <div className="p-5">
            {/* 제목 */}
            <h3
              className="font-semibold text-lg mb-4 text-gray-900 dark:text-white leading-tight"
            >
              {node.title}
            </h3>

            {/* 담당자 아바타 */}
            {node.assignees.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex -space-x-3">
                  {node.assignees.slice(0, 3).map((assignee: Assignee, idx: number) => (
                    <div
                      key={assignee.id}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white dark:border-[#2c2c2e] shadow-sm text-white"
                      style={{
                        background: getInitialColor(assignee.name),
                        zIndex: 3 - idx,
                      }}
                      title={assignee.name}
                    >
                      {assignee.name.charAt(0)}
                    </div>
                  ))}
                  {node.assignees.length > 3 && (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white dark:border-[#2c2c2e] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300"
                    >
                      +{node.assignees.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 메타 */}
            <div className="flex items-center justify-between mt-auto">
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-400"
              >
                {getStatusLabel(node.status)}
              </span>

              {/* 파일 첨부 버튼 */}
              <button
                className="p-1.5 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-blue-500"
                title="파일 첨부"
                onClick={(e) => e.stopPropagation()}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
            </div>
          </div>
      </div>

      {/* 연결 포인트 - 오른쪽 (Hover시 등장) */}
      <div
        className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white dark:border-gray-800 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 scale-0 group-hover:scale-100"
        style={{ background: '#0071e3' }}
      />
      {/* 연결 포인트 - 왼쪽 */}
      <div
        className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white dark:border-gray-800 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 scale-0 group-hover:scale-100"
        style={{ background: '#0071e3' }}
      />
    </div>
  );
}

// 유틸 함수들도 export
export { getStatusColor, getStatusLabel, getInitialColor };
