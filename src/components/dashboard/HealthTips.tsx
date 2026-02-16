'use client';

import React, { useEffect, useState } from 'react';
import { Apple, Moon, Droplets, Sun, Heart, Activity, Smile, Coffee, Dumbbell, Utensils, Brain, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const DEFAULT_TIPS = [
    { title: 'Stay Hydrated', text: 'Drink 8 glasses of water.', icon_name: 'Droplets', bg_color: "bg-blue-500", text_color: "text-blue-50" },
    { title: 'Sleep Well', text: 'Improves immunity & mood.', icon_name: 'Moon', bg_color: "bg-indigo-600", text_color: "text-indigo-50" },
    { title: 'Eat Fiber', text: 'Good for digestion.', icon_name: 'Apple', bg_color: "bg-green-600", text_color: "text-green-50" },
];

const ICON_MAP: any = {
    Droplets, Moon, Apple, Sun, Heart, Activity,
    Smile, Coffee, Dumbbell, Utensils, Brain
};

export const HealthTips: React.FC = () => {
    const [tips, setTips] = useState<any[]>(DEFAULT_TIPS);

    useEffect(() => {
        const fetchTips = async () => {
            const { data, error } = await supabase
                .from('health_tips')
                .select('*')
                .order('created_at', { ascending: false });

            if (data && data.length > 0) {
                setTips(data);
            }
        };

        fetchTips();
    }, []);

    return (
        <div className="mt-8">
            <h3 className="font-bold text-lg text-text-primary mb-4 px-1">Health Tips for You</h3>
            <div className="flex overflow-x-auto snap-x space-x-4 pb-4 no-scrollbar">
                {tips.map((tip, idx) => {
                    const Icon = ICON_MAP[tip.icon_name] || Apple;
                    return (
                        <div key={idx} className={`snap-center flex-shrink-0 w-64 md:w-72 p-5 rounded-2xl shadow-md ${tip.bg_color} text-white flex flex-col justify-between h-40 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}>
                            <div className="absolute right-[-10px] top-[-10px] opacity-20 transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
                                <Icon size={80} />
                            </div>

                            <div className="z-10 bg-white/20 w-fit p-2.5 rounded-full mb-3 backdrop-blur-sm">
                                <Icon size={24} />
                            </div>

                            <div className="z-10">
                                <h4 className="font-bold text-lg">{tip.title}</h4>
                                <p className={`text-sm opacity-90 ${tip.text_color}`}>{tip.description || tip.text}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
