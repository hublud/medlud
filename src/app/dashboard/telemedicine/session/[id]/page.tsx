import React from 'react';
import { UnifiedSessionRoom } from '@/components/telemedicine/UnifiedSessionRoom';

export default async function ConsultationSessionPage({ params }: { params: { id: string } }) {
    const { id } = params;

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-5xl mx-auto px-4 py-6">
                <UnifiedSessionRoom consultationId={id} />
            </div>
        </div>
    );
}
