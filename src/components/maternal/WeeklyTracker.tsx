'use client';

import React from 'react';
import { getWeekContent, PREGNANCY_WEEKS } from '@/data/pregnancyWeeks';
import { Baby, Heart, Apple, Sun } from 'lucide-react';

interface WeeklyTrackerProps {
    gestationalAge: number;
}

export const WeeklyTracker: React.FC<WeeklyTrackerProps> = ({ gestationalAge }) => {
    // Find content for the current week, or the most recent past week
    const weekContent = React.useMemo(() => {
        const exactMatch = getWeekContent(gestationalAge);
        if (exactMatch) return exactMatch;

        // Find the closest previous week defined in PREGNANCY_WEEKS
        // We create a copy to sort, though PREGNANCY_WEEKS should be already sorted usually
        const sortedWeeks = [...PREGNANCY_WEEKS].sort((a, b) => b.week - a.week);
        return sortedWeeks.find(w => w.week <= gestationalAge);
    }, [gestationalAge]);

    // Fallback for weeks without specific content
    const getTrimester = (week: number): 1 | 2 | 3 => {
        if (week <= 13) return 1;
        if (week <= 27) return 2;
        return 3;
    };

    const trimester = weekContent?.trimester || getTrimester(gestationalAge);

    return (
        <div className="space-y-6">
            {/* Current Week Card */}
            <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-pink-100 text-sm font-medium">You are in</p>
                        <h2 className="text-4xl font-bold">Week {gestationalAge}</h2>
                        <p className="text-pink-100 text-sm mt-1">Trimester {trimester}</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full">
                        <Baby size={40} />
                    </div>
                </div>
                <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-white rounded-full transition-all"
                        style={{ width: `${(gestationalAge / 40) * 100}%` }}
                    ></div>
                </div>
                <p className="text-pink-100 text-sm mt-2">{Math.round((gestationalAge / 40) * 100)}% through pregnancy</p>
            </div>

            {weekContent ? (
                <>
                    {/* Baby Development */}
                    <div className="bg-white rounded-xl border border-border p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-pink-100 p-3 rounded-full">
                                <Baby size={24} className="text-pink-600" />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary">Baby's Development</h3>
                        </div>
                        <p className="text-text-secondary leading-relaxed">{weekContent.babyDevelopment}</p>
                    </div>

                    {/* What to Expect */}
                    <div className="bg-white rounded-xl border border-border p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-purple-100 p-3 rounded-full">
                                <Heart size={24} className="text-purple-600" />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary">What to Expect</h3>
                        </div>
                        <ul className="space-y-2">
                            {weekContent.whatToExpect.map((item, index) => (
                                <li key={index} className="flex items-start gap-2 text-text-secondary">
                                    <span className="text-purple-600 mt-1">•</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Nutrition Tips */}
                    <div className="bg-white rounded-xl border border-border p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-green-100 p-3 rounded-full">
                                <Apple size={24} className="text-green-600" />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary">Nutrition Tips</h3>
                        </div>
                        <ul className="space-y-2">
                            {weekContent.nutritionTips.map((tip, index) => (
                                <li key={index} className="flex items-start gap-2 text-text-secondary">
                                    <span className="text-green-600 mt-1">•</span>
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Lifestyle Tips */}
                    <div className="bg-white rounded-xl border border-border p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-orange-100 p-3 rounded-full">
                                <Sun size={24} className="text-orange-600" />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary">Lifestyle Tips</h3>
                        </div>
                        <ul className="space-y-2">
                            {weekContent.lifestyleTips.map((tip, index) => (
                                <li key={index} className="flex items-start gap-2 text-text-secondary">
                                    <span className="text-orange-600 mt-1">•</span>
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </>
            ) : (
                <div className="bg-white rounded-xl border border-border p-6 text-center">
                    <p className="text-text-secondary">
                        Continue attending your ANC visits for personalized guidance for week {gestationalAge}.
                    </p>
                </div>
            )}
        </div>
    );
};
