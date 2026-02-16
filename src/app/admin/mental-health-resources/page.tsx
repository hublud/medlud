'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit, Trash2, Loader2, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CopingTechnique {
    id?: string;
    name: string;
    description: string;
    steps: string[];
    duration: string;
    category: string;
}

interface Organization {
    id?: string;
    name: string;
    description: string;
    contact: string;
}

interface SelfCareTip {
    id?: string;
    tip: string;
}

export default function MentalHealthResourcesAdminPage() {
    const [activeTab, setActiveTab] = useState<'techniques' | 'organizations' | 'tips'>('techniques');
    const [loading, setLoading] = useState(true);

    const [copingTechniques, setCopingTechniques] = useState<CopingTechnique[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [selfCareTips, setSelfCareTips] = useState<SelfCareTip[]>([]);

    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        fetchAllResources();
    }, []);

    async function fetchAllResources() {
        setLoading(true);
        try {
            const [techRes, orgsRes, tipsRes] = await Promise.all([
                supabase.from('coping_techniques').select('*').order('display_order'),
                supabase.from('mental_health_organizations').select('*').order('display_order'),
                supabase.from('self_care_tips').select('*').order('display_order')
            ]);

            if (techRes.error) throw techRes.error;
            if (orgsRes.error) throw orgsRes.error;
            if (tipsRes.error) throw tipsRes.error;

            setCopingTechniques(techRes.data || []);
            setOrganizations(orgsRes.data || []);
            setSelfCareTips(tipsRes.data || []);
        } catch (error: any) {
            console.error('Error fetching resources:', error);
            alert('Error loading resources: ' + error.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        try {
            let table = '';
            if (activeTab === 'techniques') table = 'coping_techniques';
            else if (activeTab === 'organizations') table = 'mental_health_organizations';
            else table = 'self_care_tips';

            const { id, created_at, updated_at, ...dataToSave } = formData;

            let result;
            if (editingItem) {
                // Update
                result = await supabase
                    .from(table)
                    .update({ ...dataToSave, updated_at: new Date().toISOString() })
                    .eq('id', editingItem.id);
            } else {
                // Create
                result = await supabase
                    .from(table)
                    .insert([dataToSave]);
            }

            if (result.error) throw result.error;

            await fetchAllResources();
            setIsAdding(false);
            setEditingItem(null);
            setFormData({});
        } catch (error: any) {
            console.error('Error saving:', error);
            alert(`Failed to save resource: ${error.message}`);
        }
    }

    async function handleDelete(type: string, id: string) {
        if (!confirm('Are you sure you want to delete this resource?')) return;

        try {
            let table = '';
            if (type === 'coping-techniques') table = 'coping_techniques';
            else if (type === 'organizations') table = 'mental_health_organizations';
            else table = 'self_care_tips';

            const { error } = await supabase
                .from(table)
                .delete()
                .eq('id', id);

            if (error) throw error;

            await fetchAllResources();
        } catch (error: any) {
            console.error('Error deleting:', error);
            alert('Failed to delete resource: ' + error.message);
        }
    }

    function openAddForm() {
        setIsAdding(true);
        setEditingItem(null);
        if (activeTab === 'techniques') {
            setFormData({ name: '', description: '', steps: [''], duration: '', category: 'breathing' });
        } else if (activeTab === 'organizations') {
            setFormData({ name: '', description: '', contact: '' });
        } else {
            setFormData({ tip: '' });
        }
    }

    function openEditForm(item: any) {
        setEditingItem(item);
        setIsAdding(true);
        setFormData({ ...item });
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/admin"
                        className="inline-flex items-center gap-2 text-text-secondary hover:text-primary transition-colors mb-4"
                    >
                        <ArrowLeft size={20} />
                        <span>Back to Admin</span>
                    </Link>
                    <h1 className="text-2xl font-bold text-text-primary">Manage Mental Health Resources</h1>
                    <p className="text-text-secondary">Add, edit, or remove coping techniques, organizations, and self-care tips</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-border">
                    <button
                        onClick={() => setActiveTab('techniques')}
                        className={`px-4 py-2 font-medium transition-colors ${activeTab === 'techniques'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        Coping Techniques ({copingTechniques.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('organizations')}
                        className={`px-4 py-2 font-medium transition-colors ${activeTab === 'organizations'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        Organizations ({organizations.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('tips')}
                        className={`px-4 py-2 font-medium transition-colors ${activeTab === 'tips'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        Self-Care Tips ({selfCareTips.length})
                    </button>
                </div>

                {/* Content */}
                <div>
                    {activeTab === 'techniques' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-text-primary">Coping Techniques</h2>
                                <button
                                    onClick={openAddForm}
                                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
                                >
                                    <Plus size={16} />
                                    Add Technique
                                </button>
                            </div>

                            {copingTechniques.map((tech) => (
                                <div key={tech.id} className="bg-white rounded-xl border border-border p-6">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-bold text-text-primary">{tech.name}</h3>
                                            <p className="text-sm text-text-secondary mt-1">{tech.description}</p>
                                            <span className="inline-block mt-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                                {tech.duration}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openEditForm(tech)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete('coping-techniques', tech.id!)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-sm text-text-secondary">
                                        {tech.steps.length} steps
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'organizations' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-text-primary">Organizations</h2>
                                <button
                                    onClick={openAddForm}
                                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
                                >
                                    <Plus size={16} />
                                    Add Organization
                                </button>
                            </div>

                            {organizations.map((org) => (
                                <div key={org.id} className="bg-white rounded-xl border border-border p-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-text-primary">{org.name}</h3>
                                            <p className="text-sm text-text-secondary mt-1">{org.description}</p>
                                            <p className="text-xs text-green-600 font-medium mt-2">{org.contact}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openEditForm(org)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete('organizations', org.id!)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'tips' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-text-primary">Self-Care Tips</h2>
                                <button
                                    onClick={openAddForm}
                                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
                                >
                                    <Plus size={16} />
                                    Add Tip
                                </button>
                            </div>

                            {selfCareTips.map((tip) => (
                                <div key={tip.id} className="bg-white rounded-xl border border-border p-4">
                                    <div className="flex justify-between items-center">
                                        <p className="text-text-secondary">{tip.tip}</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openEditForm(tip)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete('self-care-tips', tip.id!)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Add/Edit Form Modal */}
                {isAdding && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-text-primary">
                                    {editingItem ? 'Edit' : 'Add'} {activeTab === 'techniques' ? 'Coping Technique' : activeTab === 'organizations' ? 'Organization' : 'Self-Care Tip'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setIsAdding(false);
                                        setEditingItem(null);
                                        setFormData({});
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {activeTab === 'techniques' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-text-primary mb-1">Name</label>
                                            <input
                                                type="text"
                                                value={formData.name || ''}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                                placeholder="e.g., 4-7-8 Breathing Exercise"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
                                            <textarea
                                                value={formData.description || ''}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                                rows={3}
                                                placeholder="Brief description of the technique"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text-primary mb-1">Duration</label>
                                            <input
                                                type="text"
                                                value={formData.duration || ''}
                                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                                placeholder="e.g., 2-3 minutes"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text-primary mb-1">Category</label>
                                            <select
                                                value={formData.category || 'breathing'}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            >
                                                <option value="breathing">Breathing</option>
                                                <option value="grounding">Grounding</option>
                                                <option value="sleep">Sleep</option>
                                                <option value="journaling">Journaling</option>
                                                <option value="physical">Physical Activity</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text-primary mb-1">Steps</label>
                                            {(formData.steps || ['']).map((step: string, index: number) => (
                                                <div key={index} className="flex gap-2 mb-2">
                                                    <input
                                                        type="text"
                                                        value={step}
                                                        onChange={(e) => {
                                                            const newSteps = [...(formData.steps || [''])];
                                                            newSteps[index] = e.target.value;
                                                            setFormData({ ...formData, steps: newSteps });
                                                        }}
                                                        className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                                        placeholder={`Step ${index + 1}`}
                                                    />
                                                    {index > 0 && (
                                                        <button
                                                            onClick={() => {
                                                                const newSteps = formData.steps.filter((_: any, i: number) => i !== index);
                                                                setFormData({ ...formData, steps: newSteps });
                                                            }}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => setFormData({ ...formData, steps: [...(formData.steps || ['']), ''] })}
                                                className="text-sm text-primary hover:underline"
                                            >
                                                + Add Step
                                            </button>
                                        </div>
                                    </>
                                )}

                                {activeTab === 'organizations' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-text-primary mb-1">Name</label>
                                            <input
                                                type="text"
                                                value={formData.name || ''}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                                placeholder="Organization name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
                                            <textarea
                                                value={formData.description || ''}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                                rows={3}
                                                placeholder="What services they provide"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text-primary mb-1">Contact Information</label>
                                            <input
                                                type="text"
                                                value={formData.contact || ''}
                                                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                                placeholder="Phone, email, or website"
                                            />
                                        </div>
                                    </>
                                )}

                                {activeTab === 'tips' && (
                                    <div>
                                        <label className="block text-sm font-medium text-text-primary mb-1">Self-Care Tip</label>
                                        <textarea
                                            value={formData.tip || ''}
                                            onChange={(e) => setFormData({ ...formData, tip: e.target.value })}
                                            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            rows={3}
                                            placeholder="Enter a self-care tip"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 mt-6">
                                <button
                                    onClick={handleSave}
                                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
                                >
                                    <Save size={16} />
                                    Save
                                </button>
                                <button
                                    onClick={() => {
                                        setIsAdding(false);
                                        setEditingItem(null);
                                        setFormData({});
                                    }}
                                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
