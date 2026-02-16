'use client';

import React, { useState } from 'react';
import { PhoneCall } from 'lucide-react';
import { EmergencySOSModal } from './EmergencySOSModal';

export const EmergencyButton: React.FC = () => {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="fixed bottom-6 right-6 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white px-6 py-4 rounded-full shadow-lg flex items-center space-x-3 z-50 transition-all duration-300 hover:scale-105 group"
                aria-label="Emergency Call"
            >
                <div className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition-colors">
                    <PhoneCall size={24} className="animate-pulse" />
                </div>
                <div className="text-left">
                    <span className="block font-bold text-lg leading-none">Emergency</span>
                    <span className="text-xs opacity-90">Tap for help</span>
                </div>
            </button>
            <EmergencySOSModal isOpen={showModal} onClose={() => setShowModal(false)} />
        </>
    );
};
