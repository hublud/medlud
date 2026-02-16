import { useState, useEffect, useCallback, useRef } from 'react';
import AgoraRTC, {
    IAgoraRTCClient,
    ICameraVideoTrack,
    IMicrophoneAudioTrack,
    IAgoraRTCRemoteUser
} from 'agora-rtc-sdk-ng';

export const useAgora = (appId: string | null) => {
    const [client, setClient] = useState<IAgoraRTCClient | null>(null);
    const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
    const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
    const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
    const [joinState, setJoinState] = useState(false);
    const [connectionState, setConnectionState] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTING'>('DISCONNECTED');

    useEffect(() => {
        if (!appId) return;
        const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        setClient(agoraClient);

        // Monitor connection state
        const handleStateChange = (curState: any, prevState: any) => {
            console.log('Agora Connection State Change:', prevState, '->', curState);
            setConnectionState(curState);
        };
        agoraClient.on('connection-state-change', handleStateChange);

        return () => {
            agoraClient.off('connection-state-change', handleStateChange);
            agoraClient.leave();
        };
    }, [appId]);

    const join = useCallback(async (channel: string, token: string, uid: number, type: 'VIDEO' | 'VOICE') => {
        if (!client || !appId) {
            console.error('Agora client or AppID not ready');
            return;
        }

        // Prevent joining if already in the process
        if (client.connectionState !== 'DISCONNECTED') {
            console.warn('Agora: Cannot join while in state:', client.connectionState);
            if (client.connectionState === 'CONNECTED') return; // Already joined
            // If in a transition state, we might need to wait or leave first
            await client.leave();
        }

        try {
            // Handle remote user events
            client.on('user-published', async (user, mediaType) => {
                await client.subscribe(user, mediaType);
                if (mediaType === 'video') {
                    setRemoteUsers(prev => [...prev.filter(u => u.uid !== user.uid), user]);
                }
                if (mediaType === 'audio') {
                    user.audioTrack?.play();
                }
            });

            client.on('user-unpublished', (user) => {
                setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
            });

            client.on('user-left', (user) => {
                setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
            });

            console.log('Agora: Joining channel:', channel, 'with UID:', uid);
            await client.join(appId, channel, token, uid);

            const audioTrack = await AgoraRTC.createMicrophoneAudioTrack().catch(err => {
                console.error('Failed to create audio track:', err);
                throw err;
            });
            setLocalAudioTrack(audioTrack);

            if (type === 'VIDEO') {
                const videoTrack = await AgoraRTC.createCameraVideoTrack().catch(err => {
                    console.error('Failed to create video track:', err);
                    return null; // Allow audio-only if video fails
                });
                if (videoTrack) {
                    setLocalVideoTrack(videoTrack);
                    await client.publish([audioTrack, videoTrack]);
                } else {
                    await client.publish([audioTrack]);
                }
            } else {
                await client.publish([audioTrack]);
            }

            setJoinState(true);
        } catch (error: any) {
            console.error('Agora Join Error:', error);
            setJoinState(false);
            throw error;
        }
    }, [client, appId]);

    const leave = useCallback(async () => {
        console.log('Agora: Leaving channel...');
        if (localAudioTrack) {
            localAudioTrack.stop();
            localAudioTrack.close();
        }
        if (localVideoTrack) {
            localVideoTrack.stop();
            localVideoTrack.close();
        }
        setRemoteUsers([]);
        setJoinState(false);
        if (client) {
            // Clean up listeners
            client.removeAllListeners('user-published');
            client.removeAllListeners('user-unpublished');
            client.removeAllListeners('user-left');
            await client.leave();
        }
    }, [client, localAudioTrack, localVideoTrack]);

    return {
        localVideoTrack,
        localAudioTrack,
        remoteUsers,
        join,
        leave,
        joinState,
        connectionState
    };
};
