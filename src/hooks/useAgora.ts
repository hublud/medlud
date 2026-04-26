import { useState, useEffect, useCallback, useRef } from 'react';
import AgoraRTC, {
    IAgoraRTCClient,
    ICameraVideoTrack,
    IMicrophoneAudioTrack,
    IAgoraRTCRemoteUser
} from 'agora-rtc-sdk-ng';

export const useAgora = (appId: string | null) => {
    // Use a ref for the client so it's available synchronously (avoids the 
    // null-client race condition from using useState + useEffect for initialization)
    const clientRef = useRef<IAgoraRTCClient | null>(null);

    const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
    const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
    const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
    const [joinState, setJoinState] = useState(false);
    const [connectionState, setConnectionState] = useState<
        'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTING'
    >('DISCONNECTED');

    // Create client once when appId is ready
    useEffect(() => {
        if (!appId) return;
        if (clientRef.current) return; // Already created

        const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = agoraClient;

        const handleStateChange = (curState: any, prevState: any) => {
            console.log('Agora Connection State:', prevState, '->', curState);
            setConnectionState(curState);
        };

        agoraClient.on('connection-state-change', handleStateChange);

        return () => {
            agoraClient.off('connection-state-change', handleStateChange);
            // Don't call leave() here — leave() is handled explicitly by consumers
        };
    }, [appId]);

    const join = useCallback(
        async (channel: string, token: string, uid: number, type: 'VIDEO' | 'VOICE') => {
            if (!appId) throw new Error('Agora App ID not set');

            // Lazily create client if it hasn't been created yet
            if (!clientRef.current) {
                clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
            }

            const client = clientRef.current;

            // Guard against already-connected or mid-connection states
            if (client.connectionState === 'CONNECTED') {
                console.warn('Agora: Already connected, skipping join');
                return;
            }

            if (client.connectionState !== 'DISCONNECTED') {
                console.warn('Agora: Waiting, connection state is:', client.connectionState);
                await client.leave();
            }

            // Set up remote user event handlers before joining
            client.removeAllListeners('user-published');
            client.removeAllListeners('user-unpublished');
            client.removeAllListeners('user-left');

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

            try {
                console.log('Agora: Joining channel:', channel, '| uid:', uid);

                // Step 1: Join the channel FIRST and wait for it to complete
                await client.join(appId, channel, token, uid);
                console.log('Agora: Successfully joined channel');

                // Step 2: Create media tracks AFTER join completes
                const audioTrack = await AgoraRTC.createMicrophoneAudioTrack().catch((err) => {
                    console.error('Audio track creation failed:', err);
                    throw new Error('Could not access your microphone. Please check permissions.');
                });
                setLocalAudioTrack(audioTrack);

                let tracksToPublish: any[] = [audioTrack];

                if (type === 'VIDEO') {
                    const videoTrack = await AgoraRTC.createCameraVideoTrack().catch((err) => {
                        console.warn('Camera track creation failed (continuing audio-only):', err);
                        return null;
                    });
                    if (videoTrack) {
                        setLocalVideoTrack(videoTrack);
                        tracksToPublish.push(videoTrack);
                    }
                }

                // Step 3: Publish ONLY after join is confirmed complete
                await client.publish(tracksToPublish);
                console.log('Agora: Published tracks successfully');

                setJoinState(true);

            } catch (error: any) {
                console.error('Agora Join/Publish Error:', error);
                setJoinState(false);
                throw error;
            }
        },
        [appId]
    );

    const leave = useCallback(async () => {
        console.log('Agora: Leaving channel...');
        const client = clientRef.current;

        if (localAudioTrack) {
            localAudioTrack.stop();
            localAudioTrack.close();
        }
        if (localVideoTrack) {
            localVideoTrack.stop();
            localVideoTrack.close();
        }

        setLocalAudioTrack(null);
        setLocalVideoTrack(null);
        setRemoteUsers([]);
        setJoinState(false);

        if (client) {
            client.removeAllListeners('user-published');
            client.removeAllListeners('user-unpublished');
            client.removeAllListeners('user-left');
            if (client.connectionState !== 'DISCONNECTED') {
                await client.leave();
            }
        }
    }, [localAudioTrack, localVideoTrack]);

    return {
        localVideoTrack,
        localAudioTrack,
        remoteUsers,
        join,
        leave,
        joinState,
        connectionState,
    };
};
