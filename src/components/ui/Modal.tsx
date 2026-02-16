'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Use createPortal to render modal at the end of the document body
    // access document only on client side
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                ref={modalRef}
                className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-text-primary">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-text-secondary hover:text-text-primary hover:bg-gray-100 p-1 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};
