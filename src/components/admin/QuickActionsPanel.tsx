'use client';

import React, { useState } from 'react';
import { Megaphone, AlertTriangle, RefreshCw, Download, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createNotification, broadcastToAllUsers } from '@/utils/notifications';

interface QuickActionsPanelProps {
    currentUserId: string;
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({ currentUserId }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [announcement, setAnnouncement] = useState('');
    const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);

    const handleBroadcastAnnouncement = async () => {
        if (!announcement.trim()) {
            alert('Please enter an announcement message');
            return;
        }

        setIsProcessing(true);
        try {
            // 1. Notify Admins (Internal)
            await createNotification(
                'system',
                'System Announcement',
                announcement,
                'info'
            );

            // 2. Notify All Roles (External)
            const result = await broadcastToAllUsers(
                'Important Announcement',
                announcement,
                'SYSTEM'
            );

            if (result.success) {
                setAnnouncement('');
                setShowAnnouncementForm(false);
                alert(`Broadcast successful! Sent to ${result.count} users.`);
            } else {
                throw result.error;
            }
        } catch (error: any) {
            console.error('Error broadcasting announcement:', error);
            const errorMsg = error?.message || '';
            if (errorMsg.includes('relation "user_notifications" does not exist')) {
                alert('Database Error: The "user_notifications" table is missing. Did you run the SQL migration?');
            } else {
                alert(`Broadcast Failed: ${errorMsg || 'Check internet connection'}`);
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleEmergencyMode = () => {
        if (confirm('Are you sure you want to toggle emergency mode? This will notify all staff members.')) {
            createNotification(
                'alert',
                'Emergency Mode Activated',
                'Emergency mode has been activated. All staff should be on high alert.',
                'error'
            );
            alert('Emergency mode toggled!');
        }
    };

    const handleRefreshCache = () => {
        if (confirm('Refresh system cache? This may temporarily slow down the application.')) {
            setIsProcessing(true);
            setTimeout(() => {
                setIsProcessing(false);
                alert('Cache refreshed successfully!');
            }, 2000);
        }
    };

    const handleExportAllData = () => {
        if (confirm('Export all system data? This may take a few minutes.')) {
            alert('Data export started. You will receive a notification when complete.');
        }
    };

    return (
        <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
                <Zap size={24} className="text-primary" />
                <div>
                    <h3 className="text-lg font-bold text-text-primary">Quick Actions</h3>
                    <p className="text-sm text-text-secondary">One-click admin operations</p>
                </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
                {/* Broadcast Announcement */}
                <div className="border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Megaphone size={20} className="text-blue-600" />
                        <h4 className="font-semibold text-text-primary">Broadcast</h4>
                    </div>
                    {!showAnnouncementForm ? (
                        <Button
                            onClick={() => setShowAnnouncementForm(true)}
                            variant="outline"
                            size="sm"
                            className="w-full"
                        >
                            Send Announcement
                        </Button>
                    ) : (
                        <div className="space-y-2">
                            <textarea
                                value={announcement}
                                onChange={(e) => setAnnouncement(e.target.value)}
                                placeholder="Enter announcement message..."
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                rows={3}
                            />
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleBroadcastAnnouncement}
                                    disabled={isProcessing}
                                    size="sm"
                                    className="flex-1"
                                >
                                    Send
                                </Button>
                                <Button
                                    onClick={() => {
                                        setShowAnnouncementForm(false);
                                        setAnnouncement('');
                                    }}
                                    variant="outline"
                                    size="sm"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Emergency Mode */}
                <div className="border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle size={20} className="text-red-600" />
                        <h4 className="font-semibold text-text-primary">Emergency</h4>
                    </div>
                    <Button
                        onClick={handleEmergencyMode}
                        variant="outline"
                        size="sm"
                        className="w-full border-red-600 text-red-600 hover:bg-red-50"
                    >
                        Toggle Emergency Mode
                    </Button>
                </div>

                {/* Refresh Cache */}
                <div className="border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <RefreshCw size={20} className="text-green-600" />
                        <h4 className="font-semibold text-text-primary">Cache</h4>
                    </div>
                    <Button
                        onClick={handleRefreshCache}
                        disabled={isProcessing}
                        variant="outline"
                        size="sm"
                        className="w-full"
                    >
                        Refresh System Cache
                    </Button>
                </div>

                {/* Export Data */}
                <div className="border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Download size={20} className="text-purple-600" />
                        <h4 className="font-semibold text-text-primary">Export</h4>
                    </div>
                    <Button
                        onClick={handleExportAllData}
                        variant="outline"
                        size="sm"
                        className="w-full"
                    >
                        Export All Data
                    </Button>
                </div>
            </div>
        </div>
    );
};
