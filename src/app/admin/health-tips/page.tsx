'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Plus, Edit2, Trash2, Droplets, Moon, Apple, Sun, Heart, Activity, Smile, Coffee, Dumbbell, Utensils, Brain, AlertCircle } from 'lucide-react';
import { HealthTipModal } from '@/components/admin/HealthTipModal';

interface HealthTip {
    id: string;
    title: string;
    description: string;
    icon_name: string;
    bg_color: string;
    text_color: string;
}

const ICON_MAP: any = {
    Droplets, Moon, Apple, Sun, Heart, Activity,
    Smile, Coffee, Dumbbell, Utensils, Brain
};

export default function HealthTipsAdminPage() {
    const [tips, setTips] = useState<HealthTip[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTip, setEditingTip] = useState<HealthTip | null>(null);

    const fetchTips = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('health_tips')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching tips:', error);
            // Fallback for demo if table doesn't exist yet
        } else {
            setTips(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTips();
    }, []);

    const handleSave = async (tipData: any) => {
        try {
            if (tipData.id) {
                // Update
                const { error } = await supabase
                    .from('health_tips')
                    .update({
                        title: tipData.title,
                        description: tipData.description,
                        icon_name: tipData.icon_name,
                        bg_color: tipData.bg_color,
                        text_color: tipData.text_color,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', tipData.id);
                if (error) throw error;
            } else {
                // Create
                const { error } = await supabase
                    .from('health_tips')
                    .insert({
                        title: tipData.title,
                        description: tipData.description,
                        icon_name: tipData.icon_name,
                        bg_color: tipData.bg_color,
                        text_color: tipData.text_color
                    });
                if (error) throw error;
            }
            await fetchTips();
            setIsModalOpen(false);
            setEditingTip(null);
        } catch (error: any) {
            alert('Error saving tip: ' + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this tip?')) return;

        const { error } = await supabase
            .from('health_tips')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Error deleting tip: ' + error.message);
        } else {
            await fetchTips();
        }
    };

    const openEdit = (tip: HealthTip) => {
        setEditingTip(tip);
        setIsModalOpen(true);
    };

    const openCreate = () => {
        setEditingTip(null);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Health Tips Management</h1>
                <Button onClick={openCreate} leftIcon={<Plus size={18} />}>
                    Add New Tip
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading tips...</div>
            ) : tips.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-dashed border-gray-300">
                    <div className="bg-gray-100 p-4 rounded-full w-fit mx-auto mb-4">
                        <AlertCircle size={32} className="text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900">No tips found</h3>
                    <p className="text-gray-500 text-sm mt-1 mb-4">Get started by creating your first health tip.</p>
                    <Button onClick={openCreate} size="sm">Create Tip</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tips.map((tip) => {
                        const Icon = ICON_MAP[tip.icon_name] || Apple;
                        return (
                            <div key={tip.id} className={`rounded-2xl p-6 ${tip.bg_color} text-white relative group overflow-hidden shadow-lg transition-transform hover:-translate-y-1`}>
                                <div className="absolute right-[-10px] top-[-10px] opacity-20 transform rotate-12">
                                    <Icon size={80} />
                                </div>

                                <div className="relative z-10">
                                    <div className="bg-white/20 w-fit p-2 rounded-lg mb-4 backdrop-blur-sm">
                                        <Icon size={20} />
                                    </div>
                                    <h3 className="font-bold text-lg mb-2">{tip.title}</h3>
                                    <p className={`text-sm opacity-90 ${tip.text_color}`}>{tip.description}</p>

                                    <div className="mt-4 flex gap-2 pt-4 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEdit(tip)}
                                            className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(tip.id)}
                                            className="p-1.5 bg-white/20 hover:bg-red-500/80 rounded-lg text-white transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <HealthTipModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingTip}
            />
        </div>
    );
}
