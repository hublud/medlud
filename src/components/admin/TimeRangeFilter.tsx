'use client';

import React from 'react';
import { TimeRange } from '@/utils/analytics';

interface TimeRangeFilterProps {
    selectedRange: TimeRange;
    onRangeChange: (range: TimeRange) => void;
}

export const TimeRangeFilter: React.FC<TimeRangeFilterProps> = ({ selectedRange, onRangeChange }) => {
    const ranges: { value: TimeRange; label: string }[] = [
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'year', label: 'This Year' }
    ];

    return (
        <div className="flex gap-2 flex-wrap">
            {ranges.map(range => (
                <button
                    key={range.value}
                    onClick={() => onRangeChange(range.value)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${selectedRange === range.value
                            ? 'bg-primary text-white'
                            : 'bg-white text-text-secondary border border-border hover:border-primary'
                        }`}
                >
                    {range.label}
                </button>
            ))}
        </div>
    );
};
