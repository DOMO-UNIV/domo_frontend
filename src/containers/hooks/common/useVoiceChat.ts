import { useEffect, useRef, useState, useCallback } from 'react';
import { API_CONFIG, getWebSocketUrl } from '@/src/models/api/config';
import type { SignalData, VoiceChatError, VoiceChatErrorType } from '@/src/models/types';

const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

interface UseVoiceChatReturn {
    /** 연결 상태 */
    isConnected: boolean;
    /** 마이크 음소거 상태 */
    isMuted: boolean;
    /** 스피커 음소거 상태 */
    isDeafened: boolean;
    /** 현재 연결된 peer ID 목록 */
    activePeerIds: number[];
    /** 로컬 MediaStream (오디오 분석용) */
    localStream: MediaStream | null;
    /** 에러 상태 */
    error: VoiceChatError | null;
    /** 연결 시도 중 상태 */
    isConnecting: boolean;
    /** 채널 입장 */
    joinVoiceChannel: () => Promise<void>;
    /** 채널 퇴장 */
    leaveVoiceChannel: () => void;
    /** 마이크 토글 */
    toggleMute: () => void;
    /** 스피커 토글 */
    toggleDeafen: () => void;
    /** 에러 초기화 */
    clearError: () => void;
}

/**
 * WebRTC 기반 음성 채팅 hook
 * WebSocket Signaling을 통한 P2P 연결 관리
 */
export function useVoiceChat(projectId: number, userId: number): UseVoiceChatReturn {
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isDeafened, setIsDeafened] = useState(false);
    const [activePeerIds, setActivePeerIds] = useState<number[]>([]);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<VoiceChatError | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    const isDeafenedRef = useRef(false);
    const socketRef = useRef<WebSocket | null>(null);
    const pcsRef = useRef<{ [key: number]: RTCPeerConnection }>({});
    const remoteAudiosRef = useRef<{ [key: number]: HTMLAudioElement }>({});
    const localStreamRef = useRef<MediaStream | null>(null);

    // -------------------------------------------------------------------------
    // Error Handling
    // -------------------------------------------------------------------------
    
    const setVoiceChatError = useCallback((type: VoiceChatErrorType, message: string) => {
        setError({ type, message });
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // -------------------------------------------------------------------------
    // Helper Functions
    // -------------------------------------------------------------------------

    // [Helper] 연결 종료 처리
    const closePeerConnection = useCallback((peerId: number) => {
        if (pcsRef.current[peerId]) {
            pcsRef.current[peerId].close();
            delete pcsRef.current[peerId];
            setActivePeerIds((prev) => prev.filter((id) => id !== peerId));
        }
        if (remoteAudiosRef.current[peerId]) {
            remoteAudiosRef.current[peerId].pause();
            remoteAudiosRef.current[peerId].srcObject = null;
            delete remoteAudiosRef.current[peerId];
        }
    }, []);

    // [Helper] ICE Candidate 처리
    const handleIce = useCallback(async (senderId: number, candidate: RTCIceCandidateInit) => {
        const pc = pcsRef.current[senderId];
        if (pc && pc.remoteDescription) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error(`Error adding ICE candidate from ${senderId}`, e);
            }
        }
    }, []);

    // [Helper] Answer 처리
    const handleAnswer = useCallback(async (senderId: number, sdp: RTCSessionDescriptionInit) => {
        const pc = pcsRef.current[senderId];
        if (pc) {
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            } catch (e) {
                console.error(`Error handling answer from ${senderId}`, e);
            }
        }
    }, []);

    // [Helper] Peer Connection 생성
    const createPeerConnection = useCallback(async (peerId: number, stream: MediaStream, isOfferer: boolean) => {
        if (pcsRef.current[peerId]) return;

        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcsRef.current[peerId] = pc;

        setActivePeerIds((prev) => {
            if (prev.includes(peerId)) return prev;
            return [...prev, peerId];
        });

        // 로컬 트랙 추가
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // 원격 트랙 수신 처리
        pc.ontrack = (event) => {
            if (!remoteAudiosRef.current[peerId]) {
                const remoteAudio = new Audio();
                remoteAudio.srcObject = event.streams[0];
                remoteAudio.autoplay = true;
                remoteAudio.muted = isDeafenedRef.current;
                remoteAudiosRef.current[peerId] = remoteAudio;

                // 자동 재생 정책 대응
                remoteAudio.play().catch(() => {
                    // 자동 재생 실패 시 사용자 인터랙션 후 재시도
                    const playOnInteraction = () => {
                        remoteAudio.play().catch(console.error);
                        document.removeEventListener('click', playOnInteraction);
                    };
                    document.addEventListener('click', playOnInteraction, { once: true });
                });
            }
        };

        // ICE Candidate 전송
        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                    type: 'ice',
                    senderId: userId,
                    targetId: peerId,
                    candidate: event.candidate,
                }));
            }
        };

        // 연결 상태 모니터링
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                closePeerConnection(peerId);
            }
        };

        // Offerer인 경우 Offer 생성 및 전송
        if (isOfferer) {
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socketRef.current?.send(JSON.stringify({
                    type: 'offer',
                    senderId: userId,
                    targetId: peerId,
                    sdp: offer,
                }));
            } catch (e) {
                console.error(`Error creating offer for peer ${peerId}`, e);
            }
        }
    }, [userId, closePeerConnection]);

    // [Helper] Offer 처리
    const handleOffer = useCallback(async (senderId: number, sdp: RTCSessionDescriptionInit, stream: MediaStream) => {
        await createPeerConnection(senderId, stream, false);
        const pc = pcsRef.current[senderId];
        if (!pc) return;

        try {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socketRef.current?.send(JSON.stringify({
                type: 'answer',
                senderId: userId,
                targetId: senderId,
                sdp: answer,
            }));
        } catch (e) {
            console.error(`Error handling offer from ${senderId}`, e);
        }
    }, [createPeerConnection, userId]);

    // -------------------------------------------------------------------------
    // Main Logic Functions
    // -------------------------------------------------------------------------

    // [Cleanup] 전체 정리
    const cleanup = useCallback(() => {
        setIsConnected(false);
        setIsMuted(false);
        setIsDeafened(false);
        setActivePeerIds([]);
        setLocalStream(null);
        setIsConnecting(false);
        isDeafenedRef.current = false;

        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }

        Object.keys(pcsRef.current).forEach((key) => {
            const peerId = parseInt(key);
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

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
        }
    }, []);

    // [Action] 채널 입장
    const joinVoiceChannel = useCallback(async () => {
        if (isConnected || socketRef.current || isConnecting) return;

        setIsConnecting(true);
        clearError();

        // Mock Mode
        if (API_CONFIG.USE_MOCK) {
            setIsConnected(true);
            setActivePeerIds([userId, 999]);
            setIsConnecting(false);
            return;
        }

        // 브라우저 지원 체크
        if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setVoiceChatError(
                'not_supported',
                '이 브라우저에서는 음성 채팅을 지원하지 않습니다. Chrome, Firefox, Safari 최신 버전을 사용해 주세요.'
            );
            setIsConnecting(false);
            return;
        }

        // HTTPS 체크 (localhost 제외)
        if (typeof window !== 'undefined' && 
            window.location.protocol !== 'https:' && 
            !window.location.hostname.includes('localhost') &&
            window.location.hostname !== '127.0.0.1') {
            setVoiceChatError(
                'not_supported',
                '보안 연결(HTTPS)이 필요합니다. 관리자에게 문의해 주세요.'
            );
            setIsConnecting(false);
            return;
        }

        try {
            // 마이크 권한 요청
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: false,
            });

            localStreamRef.current = stream;
            setLocalStream(stream);

            // WebSocket 연결
            const wsUrl = getWebSocketUrl(`ws/projects/${projectId}/voice`);
            const ws = new WebSocket(wsUrl);
            socketRef.current = ws;

            ws.onopen = () => {
                setIsConnected(true);
                setActivePeerIds([userId]);
                setIsConnecting(false);
                ws.send(JSON.stringify({ type: 'join', senderId: userId }));
            };

            ws.onmessage = async (event) => {
                const data: SignalData = JSON.parse(event.data);
                if (data.targetId && data.targetId !== userId) return;

                switch (data.type) {
                    case 'join':
                        if (data.senderId !== userId) {
                            createPeerConnection(data.senderId, stream, true);
                        }
                        break;
                    case 'offer':
                        if (data.sdp) await handleOffer(data.senderId, data.sdp, stream);
                        break;
                    case 'answer':
                        if (data.sdp) await handleAnswer(data.senderId, data.sdp);
                        break;
                    case 'ice':
                        if (data.candidate) await handleIce(data.senderId, data.candidate);
                        break;
                    case 'user_left':
                        closePeerConnection(data.senderId);
                        break;
                }
            };

            ws.onerror = () => {
                setVoiceChatError(
                    'connection_failed',
                    '서버 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.'
                );
                cleanup();
            };

            ws.onclose = () => {
                cleanup();
            };

        } catch (err) {
            console.error('Failed to join voice chat:', err);
            
            // 에러 타입에 따른 메시지 처리
            if (err instanceof DOMException) {
                switch (err.name) {
                    case 'NotAllowedError':
                    case 'PermissionDeniedError':
                        setVoiceChatError(
                            'permission_denied',
                            '마이크 사용 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해 주세요.'
                        );
                        break;
                    case 'NotFoundError':
                    case 'DevicesNotFoundError':
                        setVoiceChatError(
                            'not_supported',
                            '마이크를 찾을 수 없습니다. 마이크가 연결되어 있는지 확인해 주세요.'
                        );
                        break;
                    case 'NotReadableError':
                    case 'TrackStartError':
                        setVoiceChatError(
                            'not_supported',
                            '마이크를 사용할 수 없습니다. 다른 앱에서 마이크를 사용 중인지 확인해 주세요.'
                        );
                        break;
                    default:
                        setVoiceChatError(
                            'unknown',
                            '마이크 연결 중 오류가 발생했습니다. 다시 시도해 주세요.'
                        );
                }
            } else {
                setVoiceChatError(
                    'unknown',
                    '알 수 없는 오류가 발생했습니다. 다시 시도해 주세요.'
                );
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
        handleOffer,
        handleAnswer,
        handleIce,
        closePeerConnection
    ]);

    // [Action] Mute Toggle
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
            }
        }
    }, []);

    // [Action] Deafen Toggle
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
    }, []);

    // Unmount Cleanup
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
