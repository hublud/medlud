'use client';

import React from 'react';
import { Trophy, Star, TrendingUp, Award } from 'lucide-react';
import { StaffMetrics } from '@/utils/staffManagement';

interface StaffLeaderboardProps {
    metrics: StaffMetrics[];
}

export const StaffLeaderboard: React.FC<StaffLeaderboardProps> = ({ metrics }) => {
    // Sort by completion rate
    const sortedByCompletion = [...metrics].sort((a, b) => b.completionRate - a.completionRate);

    // Sort by rating
    const sortedByRating = [...metrics].sort((a, b) => b.averageRating - a.averageRating);

    // Sort by total appointments
    const sortedByVolume = [...metrics].sort((a, b) => b.totalAppointments - a.totalAppointments);

    const getRankColor = (index: number) => {
        if (index === 0) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white';
        if (index === 1) return 'bg-gradient-to-br from-gray-300 to-gray-500 text-white';
        if (index === 2) return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white';
        return 'bg-gray-100 text-gray-700';
    };

    const getRankIcon = (index: number) => {
        if (index === 0) return <Trophy size={20} />;
        if (index === 1) return <Award size={20} />;
        if (index === 2) return <Star size={20} />;
        return null;
    };

    const LeaderboardCard = ({ title, data, metric }: { title: string; data: StaffMetrics[]; metric: keyof StaffMetrics }) => (
        <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-primary" />
                {title}
            </h3>
            <div className="space-y-3">
                {data.slice(0, 5).map((staff, index) => (
                    <div
                        key={staff.staffId}
                        className={`flex items-center gap-3 p-3 rounded-lg ${index < 3 ? getRankColor(index) : 'bg-gray-50'
                            }`}
                    >
                        <div className="flex items-center justify-center w-8 h-8 font-bold">
                            {getRankIcon(index) || `#${index + 1}`}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{staff.staffName}</p>
                            <p className={`text-xs ${index < 3 ? 'opacity-90' : 'text-gray-500'}`}>
                                {staff.role.replace('-', ' ').toUpperCase()}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-lg">
                                {typeof staff[metric] === 'number'
                                    ? metric === 'averageRating'
                                        ? `${staff[metric]}⭐`
                                        : metric === 'completionRate'
                                            ? `${staff[metric]}%`
                                            : staff[metric]
                                    : staff[metric]
                                }
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="grid lg:grid-cols-3 gap-6">
            <LeaderboardCard
                title="Top by Completion Rate"
                data={sortedByCompletion}
                metric="completionRate"
            />
            <LeaderboardCard
                title="Top by Rating"
                data={sortedByRating}
                metric="averageRating"
            />
            <LeaderboardCard
                title="Top by Volume"
                data={sortedByVolume}
                metric="totalAppointments"
            />
        </div>
    );
};
