'use client';

import { useEffect } from 'react';

export default function GlobalErrorSuppressor() {
    useEffect(() => {
        const handleError = (e: ErrorEvent) => {
            if (
                e.message.includes('aborted') ||
                e.message.includes('signal is aborted without reason') ||
                e.message === 'ResizeObserver loop limit exceeded'
            ) {
                e.stopImmediatePropagation();
                e.preventDefault();
            }
        };

        const handleRejection = (e: PromiseRejectionEvent) => {
            if (
                e.reason?.name === 'AbortError' ||
                e.reason?.message?.includes('aborted') ||
                e.reason?.message?.includes('signal is aborted without reason')
            ) {
                e.preventDefault();
            }
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleRejection);

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleRejection);
        };
    }, []);

    return null;
}
