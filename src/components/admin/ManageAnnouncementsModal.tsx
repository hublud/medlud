'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Trash2, Loader2, Megaphone, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Announcement {
    id: string;
    message: string;
    created_at: string;
}

interface ManageAnnouncementsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ManageAnnouncementsModal: React.FC<ManageAnnouncementsModalProps> = ({
    isOpen,
    onClose
}) => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchAnnouncements();
        }
    }, [isOpen]);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('admin_notifications')
                .select('id, message, created_at')
                .eq('title', 'System Announcement')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAnnouncements(data as Announcement[] || []);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, message: string) => {
        if (!confirm(`Are you sure you want to delete this announcement? It will be removed from all users' inboxes instantly.`)) return;

        try {
            setDeletingId(id);

            // 1. Delete from Admin Notifications (history)
            const { error: adminErr } = await supabase
                .from('admin_notifications')
                .delete()
                .eq('id', id);

            if (adminErr) throw adminErr;

            // 2. Delete from all User Notifications (users' inboxes)
            // Note: Since we don't have a unique foreign key linking them, we rely on matching the exact message content
            // and the 'SYSTEM' type to ensure we delete the correct broadcast.
            const { error: userErr } = await supabase
                .from('user_notifications')
                .delete()
                .eq('message', message)
                .in('type', ['SYSTEM', 'APPOINTMENT']); // Usually broadcast as SYSTEM

            if (userErr) throw userErr;

            // Success, remove from local state
            setAnnouncements(prev => prev.filter(a => a.id !== id));
            // No strict alert needed on success unless desired, it's pretty clear
        } catch (error: any) {
            console.error('Error deleting announcement:', error);
            alert(`Failed to delete announcement: ${error.message || 'Unknown error'}`);
        } finally {
            setDeletingId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <Megaphone size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Manage Announcements</h2>
                            <p className="text-sm text-gray-500">View history and recall broadcasted messages</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Loader2 size={32} className="animate-spin mb-4 text-blue-600" />
                            <p>Loading announcement history...</p>
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle size={32} className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">No Announcements Found</h3>
                            <p className="text-gray-500 text-sm max-w-sm">
                                You haven't sent any system announcements yet, or they have all been deleted.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {announcements.map((announcement) => (
                                <div 
                                    key={announcement.id} 
                                    className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-start hover:border-blue-200 transition-colors"
                                >
                                    <div className="flex-1 space-y-2 relative pr-4">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                            <Clock size={12} />
                                            {new Date(announcement.created_at).toLocaleString()}
                                        </div>
                                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                            {announcement.message}
                                        </p>
                                    </div>
                                    <div className="shrink-0 pt-2 sm:pt-0">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(announcement.id, announcement.message)}
                                            disabled={deletingId === announcement.id}
                                            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors whitespace-nowrap"
                                        >
                                            {deletingId === announcement.id ? (
                                                <><Loader2 size={16} className="mr-2 animate-spin" /> Deleting...</>
                                            ) : (
                                                <><Trash2 size={16} className="mr-2" /> Delete</>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
