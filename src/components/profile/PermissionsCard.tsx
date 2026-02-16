'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { MapPin, Mic, Camera, Check, X } from 'lucide-react';

export const PermissionsCard = () => {
    const permissions = [
        { icon: MapPin, label: 'Location Access', granted: true },
        { icon: Camera, label: 'Camera Access', granted: true },
        { icon: Mic, label: 'Microphone Access', granted: false },
    ];

    return (
        <Card>
            <h2 className="text-lg font-bold text-text-primary mb-6">Device Permissions</h2>
            <div className="space-y-4">
                {permissions.map((perm, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="text-text-secondary">
                                <perm.icon size={18} />
                            </div>
                            <span className="text-sm font-medium text-text-primary">{perm.label}</span>
                        </div>
                        {perm.granted ? (
                            <span className="flex items-center gap-1 text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded border border-green-100">
                                <Check size={12} /> Allowed
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded border border-red-100">
                                <X size={12} /> Denied
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </Card>
    );
};
