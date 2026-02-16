'use client';

import React from 'react';
import {
    Settings,
    Bell,
    Shield,
    Database,
    Globe,
    Lock,
    ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AdminSettingsPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
                <p className="text-gray-500">Configure platform preferences and security controls.</p>
            </div>

            <div className="max-w-3xl space-y-6">
                {/* General Settings */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Settings size={20} className="text-primary" />
                            General Configuration
                        </h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-gray-900">Platform Name</p>
                                <p className="text-sm text-gray-500">The visible name of the application.</p>
                            </div>
                            <input
                                type="text"
                                defaultValue="MedLud"
                                className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-gray-900">Support Email</p>
                                <p className="text-sm text-gray-500">Address for user support inquiries.</p>
                            </div>
                            <input
                                type="email"
                                defaultValue="support@medlud.com"
                                className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                    </div>
                </section>

                {/* Security Settings */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Shield size={20} className="text-emerald-600" />
                            Security & Access
                        </h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                        <button className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors text-left">
                            <div className="flex items-center gap-4">
                                <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg">
                                    <Lock size={20} />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">Two-Factor Authentication</p>
                                    <p className="text-sm text-gray-500">Add an extra layer of security to admin accounts.</p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-gray-300" />
                        </button>
                        <button className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors text-left">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                                    <Database size={20} />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">API Key Management</p>
                                    <p className="text-sm text-gray-500">Manage third-party service credentials.</p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-gray-300" />
                        </button>
                    </div>
                </section>

                {/* Notification Settings */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Bell size={20} className="text-orange-500" />
                            Notifications
                        </h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-gray-900">Email Alerts</p>
                                <p className="text-sm text-gray-500">Receive alerts for new appointments.</p>
                            </div>
                            <div className="w-12 h-6 bg-primary rounded-full p-1 cursor-pointer">
                                <div className="w-4 h-4 bg-white rounded-full ml-auto" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-gray-900">System Logs</p>
                                <p className="text-sm text-gray-500">Notify of critical system errors.</p>
                            </div>
                            <div className="w-12 h-6 bg-gray-200 rounded-full p-1 cursor-pointer">
                                <div className="w-4 h-4 bg-white rounded-full" />
                            </div>
                        </div>
                    </div>
                </section>

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline">Reset to Defaults</Button>
                    <Button>Save Changes</Button>
                </div>
            </div>
        </div>
    );
}
