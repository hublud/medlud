'use client';

import React, { useState, useEffect } from 'react';
import { Server, Database, Zap, HardDrive, AlertCircle, CheckCircle } from 'lucide-react';
import { getSystemHealthSummary } from '@/utils/notifications';

export const SystemHealthDashboard: React.FC = () => {
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHealth();
        // Refresh every 60 seconds
        const interval = setInterval(loadHealth, 60000);
        return () => clearInterval(interval);
    }, []);

    const loadHealth = async () => {
        setLoading(true);
        try {
            const data = await getSystemHealthSummary();
            setHealth(data);
        } catch (error) {
            console.error('Error loading system health:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: 'healthy' | 'warning' | 'critical') => {
        switch (status) {
            case 'healthy':
                return 'text-green-600 bg-green-100';
            case 'warning':
                return 'text-yellow-600 bg-yellow-100';
            case 'critical':
                return 'text-red-600 bg-red-100';
        }
    };

    const getStatusIcon = (status: 'healthy' | 'warning' | 'critical') => {
        return status === 'healthy' ? (
            <CheckCircle size={20} />
        ) : (
            <AlertCircle size={20} />
        );
    };

    if (loading || !health) {
        return (
            <div className="bg-white rounded-xl border border-border p-6">
                <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-text-secondary">Loading system health...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
                <Server size={24} className="text-primary" />
                <div>
                    <h3 className="text-lg font-bold text-text-primary">System Health</h3>
                    <p className="text-sm text-text-secondary">Real-time monitoring</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Database Health */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Database size={20} className="text-blue-600" />
                            <h4 className="font-semibold text-text-primary">Database</h4>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(health.database.status)}`}>
                            {getStatusIcon(health.database.status)}
                            {health.database.status}
                        </span>
                    </div>

                    <div className="space-y-3">
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-text-secondary mb-1">Total Users</p>
                            <p className="text-2xl font-bold text-text-primary">{health.database.totalUsers}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-text-secondary mb-1">Total Appointments</p>
                            <p className="text-2xl font-bold text-text-primary">{health.database.totalAppointments}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-text-secondary mb-1">Connection Pool</p>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full"
                                        style={{ width: `${health.database.connectionPool}%` }}
                                    ></div>
                                </div>
                                <span className="text-sm font-semibold">{health.database.connectionPool}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* API Health */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Zap size={20} className="text-purple-600" />
                            <h4 className="font-semibold text-text-primary">API</h4>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(health.api.status)}`}>
                            {getStatusIcon(health.api.status)}
                            {health.api.status}
                        </span>
                    </div>

                    <div className="space-y-3">
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-text-secondary mb-1">Response Time</p>
                            <p className="text-2xl font-bold text-text-primary">{health.api.responseTime}ms</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-text-secondary mb-1">Uptime</p>
                            <p className="text-2xl font-bold text-text-primary">{health.api.uptime}%</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-text-secondary mb-1">Requests/Min</p>
                            <p className="text-2xl font-bold text-text-primary">{health.api.requestsPerMinute}</p>
                        </div>
                    </div>
                </div>

                {/* Storage Health */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <HardDrive size={20} className="text-green-600" />
                            <h4 className="font-semibold text-text-primary">Storage</h4>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(health.storage.status)}`}>
                            {getStatusIcon(health.storage.status)}
                            {health.storage.status}
                        </span>
                    </div>

                    <div className="space-y-3">
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-text-secondary mb-1">Used Space</p>
                            <p className="text-2xl font-bold text-text-primary">{health.storage.used} GB</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-text-secondary mb-1">Total Space</p>
                            <p className="text-2xl font-bold text-text-primary">{health.storage.total} GB</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-text-secondary mb-1">Usage</p>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-green-600 h-2 rounded-full"
                                        style={{ width: `${health.storage.percentage}%` }}
                                    ></div>
                                </div>
                                <span className="text-sm font-semibold">{health.storage.percentage}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
