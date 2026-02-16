import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MoreVertical, ShieldAlert, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LiveCallScreenProps {
    type: 'VIDEO' | 'VOICE';
    onEndCall: () => void;
    agora: any;
}

export const LiveCallScreen: React.FC<LiveCallScreenProps> = ({ type, onEndCall, agora }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(type === 'VIDEO');
    const [duration, setDuration] = useState(0);

    const localVideoRef = useRef<HTMLDivElement>(null);
    const remoteVideoRef = useRef<HTMLDivElement>(null);

    // Call timer
    useEffect(() => {
        const timer = setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Local Video Rendering
    useEffect(() => {
        if (agora.localVideoTrack && localVideoRef.current && isVideoEnabled) {
            agora.localVideoTrack.play(localVideoRef.current);
        }
    }, [agora.localVideoTrack, isVideoEnabled]);

    // Remote Video Rendering (Simplification: assuming 1 doctor for now)
    useEffect(() => {
        const remoteUser = agora.remoteUsers[0];
        if (remoteUser && remoteUser.videoTrack && remoteVideoRef.current) {
            remoteUser.videoTrack.play(remoteVideoRef.current);
        }
    }, [agora.remoteUsers]);

    const toggleMute = () => {
        if (agora.localAudioTrack) {
            const newState = !isMuted;
            agora.localAudioTrack.setEnabled(!newState);
            setIsMuted(newState);
        }
    };

    const toggleVideo = () => {
        if (agora.localVideoTrack) {
            const newState = !isVideoEnabled;
            agora.localVideoTrack.setEnabled(newState);
            setIsVideoEnabled(newState);
        }
    };
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-black rounded-2xl overflow-hidden relative animate-in fade-in duration-500">
            {/* Main Content Areas */}
            <div className="flex-1 relative bg-gray-900 flex items-center justify-center">
                {/* Remote User Video/Audio Placeholder */}
                <div className="w-full h-full bg-gray-800 flex items-center justify-center relative overflow-hidden">
                    {agora.remoteUsers.length > 0 ? (
                        <div ref={remoteVideoRef} className="w-full h-full" />
                    ) : (
                        <div className="flex flex-col items-center space-y-4">
                            <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                                <div className="w-24 h-24 rounded-full bg-primary/40 flex items-center justify-center text-white">
                                    <User size={48} />
                                </div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-white text-xl font-bold">Waiting for provider...</h3>
                                <p className="text-white/40 text-xs mt-2">{formatTime(duration)}</p>
                            </div>
                        </div>
                    )}

                    {agora.remoteUsers.length > 0 && (
                        <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-medium flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Provider Connected
                        </div>
                    )}
                </div>

                {/* Self View (Video only) */}
                {type === 'VIDEO' && isVideoEnabled && (
                    <div className="absolute bottom-24 right-4 w-32 h-48 bg-gray-800 rounded-lg border-2 border-white/20 overflow-hidden shadow-lg">
                        <div ref={localVideoRef} className="w-full h-full" />
                        {!agora.localVideoTrack && (
                            <div className="w-full h-full flex items-center justify-center text-white/50 text-xs text-center p-2">
                                Camera loading...
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Controls Bar */}
            <div className="h-20 bg-gray-900/95 backdrop-blur-md flex items-center justify-between px-6 border-t border-white/10">
                <div className="text-white/60 text-sm hidden sm:block">
                    {formatTime(duration)}
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleMute}
                        className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        title={isMuted ? 'Unmute' : 'Mute'}
                    >
                        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>

                    {type === 'VIDEO' && (
                        <button
                            onClick={toggleVideo}
                            className={`p-4 rounded-full transition-colors ${!isVideoEnabled ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                            title={isVideoEnabled ? 'Turn Camera Off' : 'Turn Camera On'}
                        >
                            {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                        </button>
                    )}

                    <button
                        onClick={onEndCall}
                        className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg hover:shadow-red-900/20"
                        title="End Call"
                    >
                        <PhoneOff size={24} />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2 text-white/60 hover:text-white rounded-full hover:bg-white/10" title="Emergency">
                        <ShieldAlert size={20} className="text-red-500" />
                    </button>
                    <button className="p-2 text-white/60 hover:text-white rounded-full hover:bg-white/10">
                        <MoreVertical size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};
