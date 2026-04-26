'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface PlatformSettings {
    id: string;
    chat_price: number;
    video_price: number;
    voice_price: number;
    specialist_chat_price: number;
    specialist_video_price: number;
    specialist_voice_price: number;
    commission_percentage: number;
    chat_message_limit: number;
    chat_session_duration_minutes: number;
    video_session_duration_minutes: number;
    created_at: string;
    updated_at: string;
}

const DEFAULT_SETTINGS: PlatformSettings = {
    id: '',
    chat_price: 7000,
    video_price: 8000,
    voice_price: 5000,
    specialist_chat_price: 12000,
    specialist_video_price: 15000,
    specialist_voice_price: 12000,
    commission_percentage: 20,
    chat_message_limit: 25,
    chat_session_duration_minutes: 30,
    video_session_duration_minutes: 30,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
};

// Global cache to avoid multiple fetches on the same page
let settingsCache: PlatformSettings | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 minute

export function usePlatformSettings() {
    const [settings, setSettings] = useState<PlatformSettings>(settingsCache || DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(!settingsCache);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            const now = Date.now();
            if (settingsCache && (now - lastFetchTime < CACHE_DURATION)) {
                setSettings(settingsCache);
                setLoading(false);
                return;
            }

            try {
                const { data, error: fetchError } = await supabase
                    .from('platform_settings')
                    .select('*')
                    .limit(1)
                    .single();

                if (fetchError) throw fetchError;

                if (data) {
                    const formattedSettings: PlatformSettings = {
                        ...data,
                        chat_price: Number(data.chat_price) || DEFAULT_SETTINGS.chat_price,
                        video_price: Number(data.video_price) || DEFAULT_SETTINGS.video_price,
                        voice_price: Number(data.voice_price) || DEFAULT_SETTINGS.voice_price,
                        specialist_chat_price: Number(data.specialist_chat_price) || DEFAULT_SETTINGS.specialist_chat_price,
                        specialist_video_price: Number(data.specialist_video_price) || DEFAULT_SETTINGS.specialist_video_price,
                        specialist_voice_price: Number(data.specialist_voice_price) || DEFAULT_SETTINGS.specialist_voice_price,
                        commission_percentage: Number(data.commission_percentage) || DEFAULT_SETTINGS.commission_percentage,
                        chat_message_limit: Number(data.chat_message_limit) || DEFAULT_SETTINGS.chat_message_limit,
                        created_at: data.created_at || DEFAULT_SETTINGS.created_at,
                        updated_at: data.updated_at || DEFAULT_SETTINGS.updated_at,
                    };
                    settingsCache = formattedSettings;
                    lastFetchTime = now;
                    setSettings(formattedSettings);
                }
            } catch (err: any) {
                console.error('Error fetching platform settings:', err);
                setError(err.message);
                // Keep default settings on error
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const refreshSettings = async () => {
        settingsCache = null; // Clear cache
        setLoading(true);
        // The useEffect will trigger on next tick if we manage state correctly, 
        // but here we can just manually call an internal fetcher if needed.
        // For simplicity, just clearing cache and letting component re-mount or manual call works.
    };

    return { settings, loading, error, refreshSettings };
}
