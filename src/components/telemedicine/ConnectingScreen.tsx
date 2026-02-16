import React, { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ConnectingScreenProps {
    onCancel: () => void;
    onConnected: () => void;
    channelName: string;
    token: string;
    uid: number;
    type: 'VIDEO' | 'VOICE';
    agora: any;
}

export const ConnectingScreen: React.FC<ConnectingScreenProps> = ({
    onCancel,
    onConnected,
    channelName,
    token,
    uid,
    type,
    agora
}) => {
    const [error, setError] = useState<string | null>(null);
    const hasJoined = React.useRef(false);

    useEffect(() => {
        if (!token || !channelName || agora.joinState || hasJoined.current) return;

        const startCall = async () => {
            try {
                hasJoined.current = true;
                await agora.join(channelName, token, uid, type);
                onConnected();
            } catch (err: any) {
                console.error('Failed to join Agora channel:', err);
                setError(err.message || 'Failed to connect to the call server.');
            }
        };

        startCall();
    }, [token, channelName, uid, type, agora, onConnected]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in duration-500">
            <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                <div className="relative bg-white p-6 rounded-full shadow-lg border-2 border-primary/20">
                    <Loader2 size={48} className="text-primary animate-spin" />
                </div>
            </div>

            <div className="space-y-2 max-w-md">
                <h2 className="text-2xl font-bold text-text-primary">Connecting...</h2>
                <p className="text-text-secondary">
                    Please wait while we connect you to an available medical professional.
                </p>
            </div>

            <Button variant="outline" onClick={onCancel} className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200">
                <X size={18} className="mr-2" />
                Cancel Request
            </Button>
        </div>
    );
};
