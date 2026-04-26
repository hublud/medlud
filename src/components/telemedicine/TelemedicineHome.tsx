import React from 'react';
import { Video, Phone, ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';


interface TelemedicineHomeProps {
    onStartCall: (type: 'VIDEO' | 'VOICE') => void;
    prices?: { video: number, chat: number };
    title?: string;
    onBack?: () => void;
}

export const TelemedicineHome: React.FC<TelemedicineHomeProps> = ({ onStartCall, prices, title = "Telemedicine", onBack }) => {
    const { settings: platformSettings } = usePlatformSettings();


    const videoPrice = prices ? prices.video : platformSettings?.video_price;
    const voicePrice = prices ? prices.chat : platformSettings?.voice_price;


    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="space-y-2">
                <div className="flex justify-center mb-6">
                    <div className="bg-primary/10 p-4 rounded-full">
                        <Video size={48} className="text-primary" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold text-text-primary">{title}</h1>
                <p className="text-text-secondary text-lg max-w-md mx-auto">
                    Get immediate medical help from qualified professionals. Choose how you want to connect.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                <button
                    onClick={() => onStartCall('VIDEO')}
                    className="flex flex-col items-center justify-center p-8 bg-white border-2 border-primary/20 rounded-2xl shadow-sm hover:shadow-md hover:border-primary hover:bg-primary/5 transition-all group"
                >
                    <div className="bg-primary/10 p-4 rounded-full mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                        <Video size={32} className="text-primary group-hover:text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-text-primary mb-1">Start Video Call</h3>
                    <p className="text-sm text-text-secondary mb-3">Face-to-face consultation</p>
                    <div className="bg-primary/5 text-primary px-3 py-1 rounded-full text-sm font-bold border border-primary/10">
                        {videoPrice ? `₦${videoPrice.toLocaleString()} / session` : '...'}
                    </div>
                </button>

                <button
                    onClick={() => onStartCall('VOICE')}
                    className="flex flex-col items-center justify-center p-8 bg-white border-2 border-blue-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                    <div className="bg-blue-100 p-4 rounded-full mb-4 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <Phone size={32} className="text-blue-600 group-hover:text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-text-primary mb-1">Start Voice Call</h3>
                    <p className="text-sm text-text-secondary mb-3">Audio-only consultation</p>
                    <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-bold border border-blue-100">
                        {voicePrice ? `₦${voicePrice.toLocaleString()} / session` : '...'}
                    </div>
                </button>
            </div>

            <div className="pt-8">
                {onBack ? (
                    <Button variant="ghost" onClick={onBack} className="text-text-secondary">
                        <ArrowLeft size={16} className="mr-2" />
                        Go Back
                    </Button>
                ) : (
                    <Link href="/dashboard">
                        <Button variant="ghost" className="text-text-secondary">
                            <ArrowLeft size={16} className="mr-2" />
                            Return to Dashboard
                        </Button>
                    </Link>
                )}
            </div>
        </div>
    );
};
