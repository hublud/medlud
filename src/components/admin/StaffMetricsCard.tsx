'use client';

import React from 'react';
import { Activity, CheckCircle, Star, Clock } from 'lucide-react';
import { StaffMetrics } from '@/utils/staffManagement';

interface StaffMetricsCardProps {
    metrics: StaffMetrics;
}

export const StaffMetricsCard: React.FC<StaffMetricsCardProps> = ({ metrics }) => {
    return (
        <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-text-primary">{metrics.staffName}</h3>
                    <p className="text-sm text-text-secondary capitalize">
                        {metrics.role.replace('-', ' ')}
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    <Star size={20} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-2xl font-bold text-text-primary">
                        {metrics.averageRating.toFixed(1)}
                    </span>
                    <span className="text-sm text-text-secondary">
                        ({metrics.totalRatings})
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity size={18} className="text-blue-600" />
                        <span className="text-sm text-blue-700 font-medium">Total</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{metrics.totalAppointments}</p>
                    <p className="text-xs text-blue-600">Appointments</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle size={18} className="text-green-600" />
                        <span className="text-sm text-green-700 font-medium">Completed</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">{metrics.completedAppointments}</p>
                    <p className="text-xs text-green-600">{metrics.completionRate}% rate</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-text-secondary">Completion Rate</span>
                    <span className="font-semibold text-text-primary">{metrics.completionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-gradient-to-r from-primary to-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(metrics.completionRate, 100)}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};
