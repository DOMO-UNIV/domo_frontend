import { useEffect, useRef, useState, useCallback } from 'react';
import { API_CONFIG, getWebSocketUrl } from '@/src/models/api/config';
import type { SignalData, VoiceChatError, VoiceChatErrorType } from '@/src/models/types';

// ============================================
// Configuration
// ============================================

const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
    ],
};

// 디버그 모드 (개발 시 true로 설정)
const DEBUG = true;

function debugLog(category: string, message: string, data?: unknown) {
    if (DEBUG) {
        const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
        console.log(`[${timestamp}] [VoiceChat:${category}]`, message, data ?? '');
    }
}

// ============================================
// Types
// ============================================

interface UseVoiceChatReturn {
    isConnected: boolean;
    isMuted: boolean;
    isDeafened: boolean;
    activePeerIds: number[];
    localStream: MediaStream | null;
    error: VoiceChatError | null;
    isConnecting: boolean;
    joinVoiceChannel: () => Promise<void>;
    leaveVoiceChannel: () => void;
    toggleMute: () => void;
    toggleDeafen: () => void;
    clearError: () => void;
}

// ============================================
// Hook Implementation
// ============================================

export function useVoiceChat(projectId: number, userId: number): UseVoiceChatReturn {
    // State
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isDeafened, setIsDeafened] = useState(false);
    const [activePeerIds, setActivePeerIds] = useState<number[]>([]);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<VoiceChatError | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    // Refs
    const isDeafenedRef = useRef(false);
    const socketRef = useRef<WebSocket | null>(null);
    const pcsRef = useRef<{ [key: number]: RTCPeerConnection }>({});
    const remoteAudiosRef = useRef<{ [key: number]: HTMLAudioElement }>({});
    const localStreamRef = useRef<MediaStream | null>(null);
    
    // ICE candidate 큐 (remoteDescription 설정 전에 도착한 candidate 보관)
    const iceCandidateQueues = useRef<{ [key: number]: RTCIceCandidateInit[] }>({});

    // -------------------------------------------------------------------------
    // Error Handling
    // -------------------------------------------------------------------------
    
    const setVoiceChatError = useCallback((type: VoiceChatErrorType, message: string) => {
        debugLog('Error', `${type}: ${message}`);
        setError({ type, message });
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // -------------------------------------------------------------------------
    // ICE Candidate Queue Processing
    // -------------------------------------------------------------------------
    
    const processIceCandidateQueue = useCallback(async (peerId: number) => {
        const pc = pcsRef.current[peerId];
        const queue = iceCandidateQueues.current[peerId];
        
        if (!pc || !queue || queue.length === 0) return;
        
        debugLog('ICE', `Processing ${queue.length} queued candidates for peer ${peerId}`);
        
        for (const candidate of queue) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
                debugLog('ICE', `Added queued candidate for peer ${peerId}`);
            } catch (e) {
                console.error(`Error adding queued ICE candidate:`, e);
            }
        }
        
        // 큐 비우기
        iceCandidateQueues.current[peerId] = [];
    }, []);

    // -------------------------------------------------------------------------
    // Helper Functions
    // -------------------------------------------------------------------------

    const closePeerConnection = useCallback((peerId: number) => {
        debugLog('PeerConnection', `Closing connection to peer ${peerId}`);
        
        if (pcsRef.current[peerId]) {
            pcsRef.current[peerId].close();
            delete pcsRef.current[peerId];
        }
        
        if (remoteAudiosRef.current[peerId]) {
            remoteAudiosRef.current[peerId].pause();
            remoteAudiosRef.current[peerId].srcObject = null;
            delete remoteAudiosRef.current[peerId];
        }
        
        if (iceCandidateQueues.current[peerId]) {
            delete iceCandidateQueues.current[peerId];
        }
        
        setActivePeerIds((prev) => prev.filter((id) => id !== peerId));
    }, []);

    const handleIce = useCallback(async (senderId: number, candidate: RTCIceCandidateInit) => {
        debugLog('ICE', `Received ICE candidate from peer ${senderId}`, candidate);
        
        const pc = pcsRef.current[senderId];
        
        if (!pc) {
            debugLog('ICE', `No PeerConnection for ${senderId}, queuing candidate`);
            if (!iceCandidateQueues.current[senderId]) {
                iceCandidateQueues.current[senderId] = [];
            }
            iceCandidateQueues.current[senderId].push(candidate);
            return;
        }
        
        if (!pc.remoteDescription) {
            debugLog('ICE', `Remote description not set for ${senderId}, queuing candidate`);
            if (!iceCandidateQueues.current[senderId]) {
                iceCandidateQueues.current[senderId] = [];
            }
            iceCandidateQueues.current[senderId].push(candidate);
            return;
        }
        
        try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
            debugLog('ICE', `Added ICE candidate for peer ${senderId}`);
        } catch (e) {
            console.error(`Error adding ICE candidate from ${senderId}:`, e);
        }
    }, []);

    const handleAnswer = useCallback(async (senderId: number, sdp: RTCSessionDescriptionInit) => {
        debugLog('Signaling', `Received ANSWER from peer ${senderId}`);
        
        const pc = pcsRef.current[senderId];
        if (!pc) {
            debugLog('Signaling', `No PeerConnection for ${senderId}, ignoring answer`);
            return;
        }
        
        try {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            debugLog('Signaling', `Set remote description (answer) for peer ${senderId}`);
            
            // 큐에 있던 ICE candidate 처리
            await processIceCandidateQueue(senderId);
        } catch (e) {
            console.error(`Error handling answer from ${senderId}:`, e);
        }
    }, [processIceCandidateQueue]);

    const createPeerConnection = useCallback((peerId: number, stream: MediaStream, isOfferer: boolean) => {
        if (pcsRef.current[peerId]) {
            debugLog('PeerConnection', `Connection already exists for peer ${peerId}`);
            return pcsRef.current[peerId];
        }

        debugLog('PeerConnection', `Creating new connection for peer ${peerId}, isOfferer=${isOfferer}`);
        
        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcsRef.current[peerId] = pc;
        iceCandidateQueues.current[peerId] = [];

        // 활성 피어 목록에 추가
        setActivePeerIds((prev) => {
            if (prev.includes(peerId)) return prev;
            debugLog('State', `Adding peer ${peerId} to active list`);
            return [...prev, peerId];
        });

        // 로컬 트랙 추가
        stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream);
            debugLog('Track', `Added local ${track.kind} track to peer ${peerId}`);
        });

        // 원격 트랙 수신
        pc.ontrack = (event) => {
            debugLog('Track', `Received remote track from peer ${peerId}`, event.track.kind);
            
            if (!remoteAudiosRef.current[peerId]) {
                const remoteAudio = new Audio();
                remoteAudio.srcObject = event.streams[0];
                remoteAudio.autoplay = true;
                remoteAudio.muted = isDeafenedRef.current;
                remoteAudiosRef.current[peerId] = remoteAudio;

                remoteAudio.play().catch((err) => {
                    debugLog('Audio', `Autoplay blocked for peer ${peerId}, waiting for interaction`, err);
                    const playOnInteraction = () => {
                        remoteAudio.play().catch(console.error);
                        document.removeEventListener('click', playOnInteraction);
                    };
                    document.addEventListener('click', playOnInteraction, { once: true });
                });
            }
        };

        // ICE Candidate 생성
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                debugLog('ICE', `Generated ICE candidate for peer ${peerId}`);
                
                if (socketRef.current?.readyState === WebSocket.OPEN) {
                    const message = {
                        type: 'ice',
                        senderId: userId,
                        targetId: peerId,
                        candidate: event.candidate.toJSON(),
                    };
                    socketRef.current.send(JSON.stringify(message));
                    debugLog('ICE', `Sent ICE candidate to peer ${peerId}`);
                }
            }
        };

        // ICE 연결 상태 변경
        pc.oniceconnectionstatechange = () => {
            debugLog('ICE', `ICE connection state for peer ${peerId}: ${pc.iceConnectionState}`);
            
            if (pc.iceConnectionState === 'connected') {
                debugLog('ICE', `Successfully connected to peer ${peerId}!`);
            } else if (pc.iceConnectionState === 'failed') {
                debugLog('ICE', `Connection failed to peer ${peerId}, attempting restart`);
                pc.restartIce();
            } else if (pc.iceConnectionState === 'disconnected') {
                debugLog('ICE', `Peer ${peerId} disconnected`);
            }
        };

        // 연결 상태 변경
        pc.onconnectionstatechange = () => {
            debugLog('PeerConnection', `Connection state for peer ${peerId}: ${pc.connectionState}`);
            
            if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                closePeerConnection(peerId);
            }
        };

        // Signaling 상태 변경
        pc.onsignalingstatechange = () => {
            debugLog('Signaling', `Signaling state for peer ${peerId}: ${pc.signalingState}`);
        };

        return pc;
    }, [userId, closePeerConnection]);

    const sendOffer = useCallback(async (peerId: number, pc: RTCPeerConnection) => {
        try {
            debugLog('Signaling', `Creating offer for peer ${peerId}`);
            
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            debugLog('Signaling', `Set local description (offer) for peer ${peerId}`);
            
            if (socketRef.current?.readyState === WebSocket.OPEN) {
                const message = {
                    type: 'offer',
                    senderId: userId,
                    targetId: peerId,
                    sdp: pc.localDescription,
                };
                socketRef.current.send(JSON.stringify(message));
                debugLog('Signaling', `Sent offer to peer ${peerId}`);
            }
        } catch (e) {
            console.error(`Error creating offer for peer ${peerId}:`, e);
        }
    }, [userId]);

    const handleOffer = useCallback(async (senderId: number, sdp: RTCSessionDescriptionInit, stream: MediaStream) => {
        debugLog('Signaling', `Received OFFER from peer ${senderId}`);
        
        // PeerConnection 생성 (Answerer로서)
        const pc = createPeerConnection(senderId, stream, false);
        if (!pc) return;

        try {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            debugLog('Signaling', `Set remote description (offer) for peer ${senderId}`);
            
            // 큐에 있던 ICE candidate 처리
            await processIceCandidateQueue(senderId);
            
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            debugLog('Signaling', `Created and set local description (answer) for peer ${senderId}`);

            if (socketRef.current?.readyState === WebSocket.OPEN) {
                const message = {
                    type: 'answer',
                    senderId: userId,
                    targetId: senderId,
                    sdp: pc.localDescription,
                };
                socketRef.current.send(JSON.stringify(message));
                debugLog('Signaling', `Sent answer to peer ${senderId}`);
            }
        } catch (e) {
            console.error(`Error handling offer from ${senderId}:`, e);
        }
    }, [createPeerConnection, userId, processIceCandidateQueue]);

    // -------------------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------------------

    const cleanup = useCallback(() => {
        debugLog('Cleanup', 'Starting cleanup...');
        
        setIsConnected(false);
        setIsMuted(false);
        setIsDeafened(false);
        setActivePeerIds([]);
        setLocalStream(null);
        setIsConnecting(false);
        isDeafenedRef.current = false;

        if (socketRef.current) {
            debugLog('Cleanup', 'Closing WebSocket');
            socketRef.current.close();
            socketRef.current = null;
        }

        Object.keys(pcsRef.current).forEach((key) => {
            const peerId = parseInt(key);
            debugLog('Cleanup', `Closing PeerConnection ${peerId}`);
            if (pcsRef.current[peerId]) {
                pcsRef.current[peerId].close();
            }
            delete pcsRef.current[peerId];
        });

        Object.keys(remoteAudiosRef.current).forEach((key) => {
            const peerId = parseInt(key);
            if (remoteAudiosRef.current[peerId]) {
                remoteAudiosRef.current[peerId].pause();
                remoteAudiosRef.current[peerId].srcObject = null;
                delete remoteAudiosRef.current[peerId];
            }
        });
        
        iceCandidateQueues.current = {};

        if (localStreamRef.current) {
            debugLog('Cleanup', 'Stopping local media tracks');
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
        }
        
        debugLog('Cleanup', 'Cleanup complete');
    }, []);

    // -------------------------------------------------------------------------
    // Join Voice Channel
    // -------------------------------------------------------------------------

    const joinVoiceChannel = useCallback(async () => {
        if (isConnected || socketRef.current || isConnecting) {
            debugLog('Join', 'Already connected or connecting, ignoring');
            return;
        }

        debugLog('Join', `Starting join process for project ${projectId}, user ${userId}`);
        setIsConnecting(true);
        clearError();

        // Mock Mode
        if (API_CONFIG.USE_MOCK) {
            debugLog('Join', 'Using mock mode');
            setIsConnected(true);
            setActivePeerIds([userId, 999]);
            setIsConnecting(false);
            return;
        }

        // 브라우저 지원 체크
        if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setVoiceChatError('not_supported', '이 브라우저에서는 음성 채팅을 지원하지 않습니다.');
            setIsConnecting(false);
            return;
        }

        try {
            // 마이크 권한 요청
            debugLog('Media', 'Requesting microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: false,
            });

            debugLog('Media', 'Microphone access granted');
            localStreamRef.current = stream;
            setLocalStream(stream);

            // WebSocket 연결
            const wsUrl = getWebSocketUrl(`ws/projects/${projectId}/voice`);
            debugLog('WebSocket', `Connecting to ${wsUrl}`);
            
            const ws = new WebSocket(wsUrl);
            socketRef.current = ws;

            ws.onopen = () => {
                debugLog('WebSocket', 'Connected successfully');
                setIsConnected(true);
                setActivePeerIds([userId]);
                setIsConnecting(false);
                
                // Join 메시지 전송
                const joinMessage = { type: 'join', senderId: userId };
                ws.send(JSON.stringify(joinMessage));
                debugLog('WebSocket', 'Sent join message', joinMessage);
            };

            ws.onmessage = async (event) => {
                const data: SignalData = JSON.parse(event.data);
                debugLog('WebSocket', `Received message: ${data.type}`, data);

                // 자신에게 온 메시지가 아니면 무시 (targetId가 있는 경우)
                if (data.targetId && data.targetId !== userId) {
                    debugLog('WebSocket', `Message not for me (target: ${data.targetId}), ignoring`);
                    return;
                }

                switch (data.type) {
                    case 'join':
                        // 다른 사용자가 입장 -> 내가 Offer를 보냄
                        if (data.senderId !== userId) {
                            debugLog('Signaling', `New peer joined: ${data.senderId}, I will send offer`);
                            const pc = createPeerConnection(data.senderId, stream, true);
                            if (pc) {
                                await sendOffer(data.senderId, pc);
                            }
                        }
                        break;
                        
                    case 'offer':
                        if (data.sdp) {
                            await handleOffer(data.senderId, data.sdp, stream);
                        }
                        break;
                        
                    case 'answer':
                        if (data.sdp) {
                            await handleAnswer(data.senderId, data.sdp);
                        }
                        break;
                        
                    case 'ice':
                        if (data.candidate) {
                            await handleIce(data.senderId, data.candidate);
                        }
                        break;
                        
                    case 'user_left':
                        debugLog('Signaling', `Peer ${data.senderId} left`);
                        if (data.senderId && data.senderId !== -1) {
                            closePeerConnection(data.senderId);
                        }
                        break;
                        
                    default:
                        debugLog('WebSocket', `Unknown message type: ${data.type}`);
                }
            };

            ws.onerror = (error) => {
                debugLog('WebSocket', 'Error occurred', error);
                setVoiceChatError('connection_failed', '서버 연결에 실패했습니다.');
                cleanup();
            };

            ws.onclose = (event) => {
                debugLog('WebSocket', `Closed: code=${event.code}, reason=${event.reason}`);
                cleanup();
            };

        } catch (err) {
            console.error('Failed to join voice chat:', err);
            
            if (err instanceof DOMException) {
                switch (err.name) {
                    case 'NotAllowedError':
                    case 'PermissionDeniedError':
                        setVoiceChatError('permission_denied', '마이크 사용 권한이 거부되었습니다.');
                        break;
                    case 'NotFoundError':
                    case 'DevicesNotFoundError':
                        setVoiceChatError('not_supported', '마이크를 찾을 수 없습니다.');
                        break;
                    case 'NotReadableError':
                    case 'TrackStartError':
                        setVoiceChatError('not_supported', '마이크를 사용할 수 없습니다.');
                        break;
                    default:
                        setVoiceChatError('unknown', '마이크 연결 중 오류가 발생했습니다.');
                }
            } else {
                setVoiceChatError('unknown', '알 수 없는 오류가 발생했습니다.');
            }
            
            cleanup();
        }
    }, [
        projectId,
        userId,
        isConnected,
        isConnecting,
        cleanup,
        clearError,
        setVoiceChatError,
        createPeerConnection,
        sendOffer,
        handleOffer,
        handleAnswer,
        handleIce,
        closePeerConnection
    ]);

    // -------------------------------------------------------------------------
    // Toggle Functions
    // -------------------------------------------------------------------------

    const toggleMute = useCallback(() => {
        if (API_CONFIG.USE_MOCK) {
            setIsMuted(prev => !prev);
            return;
        }

        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
                debugLog('Audio', `Mute toggled: ${!audioTrack.enabled}`);
            }
        }
    }, []);

    const toggleDeafen = useCallback(() => {
        if (API_CONFIG.USE_MOCK) {
            setIsDeafened(prev => !prev);
            return;
        }

        const newState = !isDeafenedRef.current;
        isDeafenedRef.current = newState;
        setIsDeafened(newState);

        Object.values(remoteAudiosRef.current).forEach((audio) => {
            audio.muted = newState;
        });
        
        debugLog('Audio', `Deafen toggled: ${newState}`);
    }, []);

    // -------------------------------------------------------------------------
    // Unmount Cleanup
    // -------------------------------------------------------------------------

    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    return {
        isConnected,
        isMuted,
        isDeafened,
        activePeerIds,
        localStream,
        error,
        isConnecting,
        joinVoiceChannel,
        leaveVoiceChannel: cleanup,
        toggleMute,
        toggleDeafen,
        clearError,
    };
}
