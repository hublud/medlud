import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
    Apple, Moon, Droplets, Sun, Heart, Activity,
    Smile, Coffee, Dumbbell, Utensils, Brain
} from 'lucide-react';

interface HealthTip {
    id?: string;
    title: string;
    description: string;
    icon_name: string;
    bg_color: string;
    text_color: string;
}

interface HealthTipModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (tip: HealthTip) => Promise<void>;
    initialData?: HealthTip | null;
}

const ICONS = [
    { value: 'Droplets', label: 'Water / Hydration', icon: Droplets },
    { value: 'Moon', label: 'Sleep / Rest', icon: Moon },
    { value: 'Apple', label: 'Nutrition / Apple', icon: Apple },
    { value: 'Sun', label: 'Sun / Outdoors', icon: Sun },
    { value: 'Heart', label: 'Heart Health', icon: Heart },
    { value: 'Activity', label: 'Exercise / Activity', icon: Activity },
    { value: 'Smile', label: 'Mental / Mood', icon: Smile },
    { value: 'Coffee', label: 'Caffeine / Energy', icon: Coffee },
    { value: 'Dumbbell', label: 'Workout / Strength', icon: Dumbbell },
    { value: 'Utensils', label: 'Diet / Food', icon: Utensils },
    { value: 'Brain', label: 'Mental / Focus', icon: Brain },
];

const COLORS = [
    { label: 'Blue (Hydration)', bg: 'bg-blue-500', text: 'text-blue-50' },
    { label: 'Indigo (Sleep)', bg: 'bg-indigo-600', text: 'text-indigo-50' },
    { label: 'Green (Nutrition)', bg: 'bg-green-600', text: 'text-green-50' },
    { label: 'Orange (Energy)', bg: 'bg-orange-500', text: 'text-orange-50' },
    { label: 'Red (Heart)', bg: 'bg-red-500', text: 'text-red-50' },
    { label: 'Purple (Mental)', bg: 'bg-purple-600', text: 'text-purple-50' },
    { label: 'Teal (Balance)', bg: 'bg-teal-600', text: 'text-teal-50' },
];

export const HealthTipModal: React.FC<HealthTipModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [iconName, setIconName] = useState('Apple');
    const [selectedColorIndex, setSelectedColorIndex] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setDescription(initialData.description);
            setIconName(initialData.icon_name);
            const colorIdx = COLORS.findIndex(c => c.bg === initialData.bg_color);
            setSelectedColorIndex(colorIdx >= 0 ? colorIdx : 0);
        } else {
            setTitle('');
            setDescription('');
            setIconName('Apple');
            setSelectedColorIndex(0);
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({
                id: initialData?.id,
                title,
                description,
                icon_name: iconName,
                bg_color: COLORS[selectedColorIndex].bg,
                text_color: COLORS[selectedColorIndex].text
            });
            onClose();
        } catch (error) {
            console.error('Failed to save tip:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Health Tip' : 'Add New Health Tip'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Stay Hydrated"
                    required
                />

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[80px]"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. Drink 8 glasses of water daily..."
                        required
                    />
                </div>

                <Select
                    label="Icon"
                    value={iconName}
                    onChange={(e) => setIconName(e.target.value)}
                    options={ICONS.map(i => ({ value: i.value, label: i.label }))}
                />

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Color Theme</label>
                    <div className="grid grid-cols-4 gap-2">
                        {COLORS.map((color, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => setSelectedColorIndex(idx)}
                                className={`h-10 rounded-lg ${color.bg} ${selectedColorIndex === idx ? 'ring-2 ring-offset-2 ring-gray-400 scale-105' : 'hover:opacity-90'}`}
                                title={color.label}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={loading}>
                        {initialData ? 'Update Tip' : 'Create Tip'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
