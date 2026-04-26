'use client';

import React, { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';

interface TagInputProps {
    label: string;
    placeholder?: string;
    tags: string[];
    onChange: (tags: string[]) => void;
    helperText?: string;
}

export const TagInput: React.FC<TagInputProps> = ({ 
    label, 
    placeholder = "Type and press enter...", 
    tags, 
    onChange,
    helperText 
}) => {
    const [inputValue, setInputValue] = useState('');

    const addTag = () => {
        const trimmed = inputValue.trim();
        if (trimmed && !tags.includes(trimmed)) {
            onChange([...tags, trimmed]);
            setInputValue('');
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
        } else if (e.key === ',' || e.key === ' ') {
            // Check if there is content before adding on comma/space
            if (inputValue.trim()) {
                e.preventDefault();
                addTag();
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-semibold text-text-primary">
                {label}
            </label>
            
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-emerald-500 transition-all min-h-[56px]">
                {tags.map((tag, index) => (
                    <span 
                        key={index} 
                        className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full border border-emerald-200 animate-in zoom-in-95 duration-200"
                    >
                        {tag}
                        <button 
                            type="button" 
                            onClick={() => removeTag(tag)}
                            className="hover:bg-emerald-200 rounded-full p-0.5 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </span>
                ))}
                
                <div className="flex-1 flex items-center min-w-[120px]">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={tags.length === 0 ? placeholder : ""}
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm placeholder:text-gray-400"
                    />
                    <button
                        type="button"
                        onClick={addTag}
                        disabled={!inputValue.trim()}
                        className="ml-2 p-1 text-primary hover:bg-primary/10 rounded-full disabled:opacity-30 transition-all"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>
            
            {helperText && (
                <p className="text-[11px] text-text-secondary pl-1 italic">
                    {helperText}
                </p>
            )}
        </div>
    );
};
