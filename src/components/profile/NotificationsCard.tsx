'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';

import { useAuth } from '@/context/AuthContext';

export const NotificationsCard = () => {
    const { profile, updateProfile } = useAuth();

    const settings = {
        appointments: profile?.notify_appointments ?? true,
        healthTips: profile?.notify_health_tips ?? true,
        emergency: profile?.notify_emergency ?? true,
        telemedicine: profile?.notify_telemedicine ?? false
    };

    const handleToggle = async (field: string, value: boolean) => {
        await updateProfile({ [field]: value });
    };

    return (
        <Card>
            <h2 className="text-lg font-bold text-text-primary mb-4">Notifications</h2>
            <div className="space-y-2 divide-y divide-border">
                <Toggle
                    label="Appointment Reminders"
                    checked={settings.appointments}
                    onChange={(checked) => handleToggle('notify_appointments', checked)}
                />
                <Toggle
                    label="Health Tips & Insights"
                    checked={settings.healthTips}
                    onChange={(checked) => handleToggle('notify_health_tips', checked)}
                />
                <Toggle
                    label="Emergency Alerts"
                    description="Critical updates for your area"
                    checked={settings.emergency}
                    onChange={(checked) => handleToggle('notify_emergency', checked)}
                />
                <Toggle
                    label="Telemedicine Updates"
                    checked={settings.telemedicine}
                    onChange={(checked) => handleToggle('notify_telemedicine', checked)}
                />
            </div>
        </Card>
    );
};
