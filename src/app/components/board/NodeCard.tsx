"use client";

import React from 'react';
import type { Node, Assignee } from '@/types';

interface NodeCardProps {
  node: Node;
  isSelected: boolean;
  isConnecting: boolean;
  onMouseDown: (e: React.MouseEvent, nodeId: number) => void;
  onClick: () => void;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'done': return 'var(--success)';
    case 'in-progress': return 'var(--warning)';
    default: return 'var(--text-tertiary)';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'done': return '완료';
    case 'in-progress': return '진행중';
    default: return '예정';
  }
}

function getInitialColor(name: string): string {
  const colors = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#818cf8', '#e879f9'];
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
          className={`absolute w-[220px] rounded-2xl overflow-hidden cursor-move ...`}
          style={{
            left: node.x,
            top: node.y,
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: isSelected
                ? '0 0 0 2px var(--accent), var(--card-shadow-hover)'
                : 'var(--card-shadow)',
          }}
          onMouseDown={(e) => onMouseDown(e, node.id)}
          onClick={onClick}
      >
        {/* 상태 인디케이터 */}
        <div
            className="h-1 rounded-t-2xl"
            style={{ backgroundColor: getStatusColor(node.status) }}
        />

        <div className="p-4">
          {/* 제목 */}
          <h3
              className="font-medium text-sm mb-3"
              style={{ color: 'var(--text-primary)' }}
          >
            {node.title}
          </h3>

          {/* 담당자 아바타 */}
          {node.assignees.length > 0 && (
              <div className="flex items-center gap-1 mb-3">
                <div className="flex -space-x-2">
                  {node.assignees.slice(0, 3).map((assignee: Assignee, idx: number) => (
                      <div
                          key={assignee.id}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 relative"
                          style={{
                            backgroundColor: getInitialColor(assignee.name),
                            borderColor: 'var(--glass-bg)',
                            color: 'white',
                            zIndex: 3 - idx,
                          }}
                          title={assignee.name}
                      >
                        {assignee.name.charAt(0)}
                      </div>
                  ))}
                  {node.assignees.length > 3 && (
                      <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2"
                          style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            borderColor: 'var(--glass-bg)',
                            color: 'var(--text-secondary)',
                          }}
                      >
                        +{node.assignees.length - 3}
                      </div>
                  )}
                </div>
              </div>
          )}

          {/* 메타 */}
          <div className="flex items-center justify-between">
          <span
              className="text-xs px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: getStatusColor(node.status),
              }}
          >
            {getStatusLabel(node.status)}
          </span>

            {/* 파일 첨부 버튼 */}
            <button
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--bg-tertiary)]"
                title="파일 첨부"
                onClick={(e) => e.stopPropagation()}
            >
              <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="var(--text-tertiary)"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
              </svg>
            </button>
          </div>
        </div>

        {/* 연결 포인트 - 오른쪽 */}
        <div
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 rounded-full border-2 hover:scale-125 transition-transform"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-secondary)',
            }}
        />
        {/* 연결 포인트 - 왼쪽 */}
        <div
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 hover:scale-125 transition-transform"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-secondary)',
            }}
        />
      </div>
  );
}

export { getStatusColor, getStatusLabel, getInitialColor };