import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export const Footer: React.FC = () => {
    return (
        <footer className="w-full py-10 px-4 flex flex-col items-center justify-center bg-transparent mt-auto border-t border-border/50">
            <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-7xl mx-auto gap-6 sm:gap-4">
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
                
                <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                    <Link href="/terms" className="text-sm text-text-secondary font-medium hover:text-primary transition-colors">Terms & Conditions</Link>
                    <Link href="/privacy-policy" className="text-sm text-text-secondary font-medium hover:text-primary transition-colors">Privacy Policy</Link>
                    <Link href="/refund-policy" className="text-sm text-text-secondary font-medium hover:text-primary transition-colors">Refund Policy</Link>
                    <Link href="/faqs" className="text-sm text-text-secondary font-medium hover:text-primary transition-colors">FAQs</Link>
                </div>

                <p className="text-sm text-text-secondary font-medium">
                    Powered by <a href="https://www.hublud.com" target="_blank" rel="noopener noreferrer" className="font-bold text-text-primary hover:text-primary transition-colors">Hublud Technology</a>
                </p>
            </div>
        </footer>
    );
};
