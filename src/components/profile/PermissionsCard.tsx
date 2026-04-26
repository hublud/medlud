'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { MapPin, Mic, Camera, Check, X, RefreshCw } from 'lucide-react';

export const PermissionsCard = () => {
    const [states, setStates] = useState({
        location: 'checking',
        camera: 'checking',
        microphone: 'checking'
    });

    const checkPermissions = useCallback(async () => {
        // 1. Check Geolocation
        try {
            const geoStatus = await navigator.permissions.query({ name: 'geolocation' as any });
            setStates(prev => ({ ...prev, location: geoStatus.state }));
            geoStatus.onchange = () => setStates(prev => ({ ...prev, location: geoStatus.state }));
        } catch (e) {
            console.warn('Geo check failed', e);
            setStates(prev => ({ ...prev, location: 'denied' }));
        }

        // 2. Check Camera & Mic via Permissions API and mediaDevices fallback
        try {
            let camStatus: PermissionStatus | null = null;
            let micStatus: PermissionStatus | null = null;
            
            try {
                camStatus = await navigator.permissions.query({ name: 'camera' as any });
                micStatus = await navigator.permissions.query({ name: 'microphone' as any });
            } catch (e) {
                // Ignore, Safari doesn't support these permissions queries
            }

            if (camStatus && micStatus) {
                setStates(prev => ({
                    ...prev,
                    camera: camStatus!.state,
                    microphone: micStatus!.state
                }));
                camStatus.onchange = () => setStates(prev => ({ ...prev, camera: camStatus!.state }));
                micStatus.onchange = () => setStates(prev => ({ ...prev, microphone: micStatus!.state }));
            } else {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const hasCam = devices.some(d => d.kind === 'videoinput' && d.label !== '');
                const hasMic = devices.some(d => d.kind === 'audioinput' && d.label !== '');

                setStates(prev => ({
                    ...prev,
                    camera: hasCam ? 'granted' : 'prompt',
                    microphone: hasMic ? 'granted' : 'prompt'
                }));
            }
        } catch (e) {
            console.warn('Devices check failed', e);
            setStates(prev => ({ ...prev, camera: 'denied', microphone: 'denied' }));
        }
    }, []);

    useEffect(() => {
        checkPermissions();
    }, [checkPermissions]);

    const requestPermission = async (type: 'location' | 'camera' | 'microphone') => {
        try {
            if (type === 'location') {
                navigator.geolocation.getCurrentPosition(() => checkPermissions(), () => checkPermissions());
            } else if (type === 'camera') {
                await navigator.mediaDevices.getUserMedia({ video: true });
                checkPermissions();
            } else if (type === 'microphone') {
                await navigator.mediaDevices.getUserMedia({ audio: true });
                checkPermissions();
            }
        } catch (e) {
            alert(`Failed to request ${type} permission. Please enable it in your browser settings.`);
            checkPermissions();
        }
    };

    const getStatusUI = (state: string, type: 'location' | 'camera' | 'microphone') => {
        if (state === 'granted') {
            return (
                <span className="flex items-center gap-1 text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded border border-green-100">
                    <Check size={12} /> Allowed
                </span>
            );
        }
        if (state === 'checking') {
            return <span className="text-xs text-gray-400 animate-pulse">Checking...</span>;
        }
        if (state === 'prompt') {
            return (
                <button
                    onClick={() => requestPermission(type)}
                    className="flex items-center gap-1 text-xs text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded border border-orange-200 hover:bg-orange-100 transition-colors"
                >
                    Enable Access
                </button>
            );
        }
        return (
            <button
                onClick={() => requestPermission(type)}
                className="flex items-center gap-1 text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded border border-red-100 hover:bg-red-100 transition-colors"
            >
                <X size={12} /> Denied (Fix in Browser Config)
            </button>
        );
    };

    const config = [
        { icon: MapPin, label: 'Location Access', type: 'location' as const },
        { icon: Camera, label: 'Camera Access', type: 'camera' as const },
        { icon: Mic, label: 'Microphone Access', type: 'microphone' as const },
    ];

    return (
        <Card>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-text-primary">Device Permissions</h2>
                <button
                    onClick={checkPermissions}
                    className="p-2 text-gray-400 hover:text-primary transition-colors"
                    title="Refresh Status"
                >
                    <RefreshCw size={16} />
                </button>
            </div>
            <div className="space-y-4">
                {config.map((perm, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="text-text-secondary">
                                <perm.icon size={18} />
                            </div>
                            <span className="text-sm font-medium text-text-primary">{perm.label}</span>
                        </div>
                        {getStatusUI((states as any)[perm.type], perm.type)}
                    </div>
                ))}
            </div>
        </Card>
    );
};
