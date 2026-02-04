// src/containers/hooks/chat/useChatSocket.ts
'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { getWebSocketUrl } from '@/src/models/api/config';
import type { ChatMessage } from '@/src/models/api/chat';

// ============================================
// 상수
// ============================================
const RECONNECT_INTERVALS = [1000, 2000, 4000, 8000, 16000, 30000];
const MAX_RECONNECT_ATTEMPTS = 10;
const HEARTBEAT_INTERVAL = 30000;

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

interface UseChatSocketOptions {
    projectId: number;
    currentUserId: number;
    enabled?: boolean;
    onMessageReceived?: (message: ChatMessage) => void;
}

interface UseChatSocketReturn {
    connectionState: ConnectionState;
    isConnected: boolean;
    sendMessage: (content: string) => void;
    disconnect: () => void;
    reconnect: () => void;
}

export function useChatSocket({
    projectId,
    currentUserId,
    enabled = true,
    onMessageReceived,
}: UseChatSocketOptions): UseChatSocketReturn {
    const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isManualDisconnectRef = useRef(false);
    const onMessageReceivedRef = useRef(onMessageReceived);

    useEffect(() => {
        onMessageReceivedRef.current = onMessageReceived;
    }, [onMessageReceived]);

    const clearTimers = useCallback(() => {
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
        if (heartbeatTimerRef.current) {
            clearInterval(heartbeatTimerRef.current);
            heartbeatTimerRef.current = null;
        }
    }, []);

    const startHeartbeat = useCallback(() => {
        if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'PING' }));
            }
        }, HEARTBEAT_INTERVAL);
    }, []);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
            return;
        }

        isManualDisconnectRef.current = false;
        setConnectionState(reconnectAttemptsRef.current > 0 ? 'reconnecting' : 'connecting');

        const url = getWebSocketUrl(`/api/ws/projects/${projectId}/chat`);
        console.log('[ChatSocket] Connecting to:', url);
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            setConnectionState('connected');
            reconnectAttemptsRef.current = 0;
            startHeartbeat();
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'PONG') return;

                if (data.type === 'MESSAGE_SENT' && data.data) {
                    onMessageReceivedRef.current?.(data.data);
                }
            } catch (e) {
                console.error('[ChatSocket] Failed to parse message:', e);
            }
        };

        ws.onclose = () => {
            clearTimers();
            if (!isManualDisconnectRef.current && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
                setConnectionState('reconnecting');
                const delay = RECONNECT_INTERVALS[Math.min(reconnectAttemptsRef.current, RECONNECT_INTERVALS.length - 1)];
                reconnectTimerRef.current = setTimeout(() => {
                    reconnectAttemptsRef.current++;
                    connect();
                }, delay);
            } else {
                setConnectionState('disconnected');
            }
        };

        ws.onerror = () => {
            // onclose가 이후에 호출되므로 여기서는 아무것도 하지 않음
        };
    }, [projectId, startHeartbeat, clearTimers]);

    const disconnect = useCallback(() => {
        isManualDisconnectRef.current = true;
        clearTimers();
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setConnectionState('disconnected');
    }, [clearTimers]);

    const reconnect = useCallback(() => {
        reconnectAttemptsRef.current = 0;
        disconnect();
        setTimeout(() => connect(), 100);
    }, [connect, disconnect]);

    const sendMessage = useCallback((content: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'MESSAGE_SENT',
                content,
                user_id: currentUserId,
            }));
        }
    }, [currentUserId]);

    // 연결/해제 lifecycle
    useEffect(() => {
        console.log('[ChatSocket] Effect triggered:', { enabled, projectId, currentUserId });
        if (enabled && projectId && currentUserId) {
            console.log('[ChatSocket] All conditions met, calling connect()');
            connect();
        } else {
            console.log('[ChatSocket] Condition not met:', {
                enabled: !!enabled,
                projectId: !!projectId,
                currentUserId: !!currentUserId,
                currentUserIdValue: currentUserId,
            });
        }
        return () => {
            isManualDisconnectRef.current = true;
            clearTimers();
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [enabled, projectId, currentUserId, connect, clearTimers]);

    return {
        connectionState,
        isConnected: connectionState === 'connected',
        sendMessage,
        disconnect,
        reconnect,
    };
}
