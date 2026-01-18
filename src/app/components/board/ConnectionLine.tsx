"use client";

import React from 'react';
import type { Node, Connection } from '@/types';

interface ConnectionLinesProps {
  connections: Connection[];
  nodes: Node[];
  isDark: boolean;
  isConnecting: boolean;
  connectFrom: number | null;
}

function getConnectionPath(from: Node, to: Node): string {
  const startX = from.x + 220;
  const startY = from.y + 50;
  const endX = to.x;
  const endY = to.y + 50;
  const midX = (startX + endX) / 2;

  return `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
}

export function ConnectionLines({
  connections,
  nodes,
  isDark,
  isConnecting,
  connectFrom,
}: ConnectionLinesProps) {
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%', minWidth: '2000px', minHeight: '1000px' }}
    >
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
          <stop offset="50%" stopColor={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'} />
          <stop offset="100%" stopColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
        </linearGradient>
      </defs>

      {/* 기존 연결선들 */}
      {connections.map((conn, idx) => {
        const fromNode = nodes.find(n => n.id === conn.from);
        const toNode = nodes.find(n => n.id === conn.to);
        if (!fromNode || !toNode) return null;

        return (
          <path
            key={idx}
            d={getConnectionPath(fromNode, toNode)}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        );
      })}

      {/* 연결 중일 때 시작점 표시 */}
      {isConnecting && connectFrom !== null && (
        <>
          <circle
            cx={(nodes.find(n => n.id === connectFrom)?.x ?? 0) + 220}
            cy={(nodes.find(n => n.id === connectFrom)?.y ?? 0) + 50}
            r="6"
            fill="var(--accent)"
          />
          <circle
            cx={(nodes.find(n => n.id === connectFrom)?.x ?? 0) + 220}
            cy={(nodes.find(n => n.id === connectFrom)?.y ?? 0) + 50}
            r="10"
            fill="var(--accent)"
            opacity="0.3"
            className="animate-ping"
          />
        </>
      )}
    </svg>
  );
}

export { getConnectionPath };
