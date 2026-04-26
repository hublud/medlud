'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Stethoscope, DollarSign, Clock, MessageSquare, AlertCircle, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const TelemedicineSettings = () => {
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const { data } = await supabase.from('platform_settings').select('*').single();
        const settingsData = data as any;
        if (settingsData) {
            setSettings({
                ...settingsData,
                voice_price: settingsData.voice_price || 5000,
                specialist_chat_price: settingsData.specialist_chat_price || 10000,
                specialist_video_price: settingsData.specialist_video_price || 15000,
                specialist_voice_price: settingsData.specialist_voice_price || 12000
            });
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage({ text: '', type: '' });

        const { error } = await supabase
            .from('platform_settings')
            .update({
                chat_price: parseFloat(settings.chat_price),
                video_price: parseFloat(settings.video_price),
                voice_price: parseFloat(settings.voice_price),
                commission_percentage: parseFloat(settings.commission_percentage),
                chat_message_limit: parseInt(settings.chat_message_limit),
                chat_session_duration_minutes: parseInt(settings.chat_session_duration_minutes),
                video_session_duration_minutes: parseInt(settings.video_session_duration_minutes),
                specialist_chat_price: parseFloat(settings.specialist_chat_price),
                specialist_video_price: parseFloat(settings.specialist_video_price),
                specialist_voice_price: parseFloat(settings.specialist_voice_price),
                updated_at: new Date().toISOString()
            })
            .eq('id', settings.id);

        if (error) {
            setMessage({ text: 'Failed to update settings: ' + error.message, type: 'error' });
        } else {
            setMessage({ text: 'Telemedicine settings saved successfully', type: 'success' });
        }
        setSaving(false);
    };

    if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>;

    if (!settings) return null;

    return (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Stethoscope size={20} className="text-teal-600" />
                    Telemedicine Platform Limits
                </h2>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white flex items-center gap-2"
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>

            {message.text && (
                <div className={`p-4 ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'} text-sm font-medium`}>
                    {message.text}
                </div>
            )}

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                {/* Financials */}
                <div className="space-y-6 pt-4 md:pt-0">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                        <DollarSign size={18} className="text-emerald-500" />
                        Default Pricing & Commission
                    </h3>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Base Chat Price (₦)</label>
                        <input
                            type="number"
                            value={settings.chat_price}
                            onChange={(e) => setSettings({ ...settings, chat_price: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                        <p className="text-xs text-gray-500 mt-1">Default cost for chat ("Talk to a Doctor").</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-blue-700 mb-1">Base Voice Price (₦)</label>
                        <input
                            type="number"
                            value={settings.voice_price}
                            onChange={(e) => setSettings({ ...settings, voice_price: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        <p className="text-xs text-gray-500 mt-1">Default cost for audio/voice calls.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Base Video Price (₦)</label>
                        <input
                            type="number"
                            value={settings.video_price}
                            onChange={(e) => setSettings({ ...settings, video_price: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-50">
                        <label className="block text-sm font-semibold text-teal-700 mb-1">Specialist Chat Price (₦)</label>
                        <input
                            type="number"
                            value={settings.specialist_chat_price}
                            onChange={(e) => setSettings({ ...settings, specialist_chat_price: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-50">
                        <label className="block text-sm font-semibold text-blue-700 mb-1">Specialist Voice Price (₦)</label>
                        <input
                            type="number"
                            value={settings.specialist_voice_price || ''}
                            onChange={(e) => setSettings({ ...settings, specialist_voice_price: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-teal-700 mb-1">Specialist Video Price (₦)</label>
                        <input
                            type="number"
                            value={settings.specialist_video_price}
                            onChange={(e) => setSettings({ ...settings, specialist_video_price: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Platform Commission (%)</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={settings.commission_percentage}
                            onChange={(e) => setSettings({ ...settings, commission_percentage: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                        <p className="text-xs text-gray-500 mt-1">Percentage Medlud takes from every consultation.</p>
                    </div>
                </div>

                {/* Session Limits */}
                <div className="space-y-6 pt-6 md:pt-0 md:pl-8">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                        <AlertCircle size={18} className="text-amber-500" />
                        Session Limits
                    </h3>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                            <MessageSquare size={14} className="text-gray-400" /> Patient Chat Messages Limit
                        </label>
                        <input
                            type="number"
                            value={settings.chat_message_limit}
                            onChange={(e) => setSettings({ ...settings, chat_message_limit: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                        <p className="text-xs text-gray-500 mt-1">Number of messages a patient can send before chat expires.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                            <Clock size={14} className="text-gray-400" /> Chat Session Duration (Minutes)
                        </label>
                        <input
                            type="number"
                            value={settings.chat_session_duration_minutes}
                            onChange={(e) => setSettings({ ...settings, chat_session_duration_minutes: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                            <Clock size={14} className="text-gray-400" /> Video Session Duration (Minutes)
                        </label>
                        <input
                            type="number"
                            value={settings.video_session_duration_minutes}
                            onChange={(e) => setSettings({ ...settings, video_session_duration_minutes: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};
