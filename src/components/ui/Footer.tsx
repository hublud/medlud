import React from 'react';
import Image from 'next/image';

export const Footer: React.FC = () => {
    return (
        <footer className="w-full py-8 px-4 flex flex-col items-center justify-center space-y-3 bg-transparent mt-auto border-t border-border/50">
            <div className="flex items-center space-x-2">
                <div className="relative w-8 h-8">
                    <Image
                        src="/medlud-logo.png"
                        alt="MedLud Logo"
                        fill
                        className="object-contain"
                    />
                </div>
                <span className="font-bold text-primary text-lg">MedLud</span>
            </div>

            <p className="text-sm text-text-secondary font-medium">
                Powered by <span className="font-bold text-text-primary">Hublud Technology</span>
            </p>
        </footer>
    );
};
