import React from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string | React.ReactNode;
    error?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, error, className = '', ...props }) => {
    return (
        <div className={`flex flex-col mb-4 ${className}`}>
            <label className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative">
                    <input
                        type="checkbox"
                        className="peer sr-only"
                        {...props}
                    />
                    <div className="w-5 h-5 border-2 border-border rounded transition-colors peer-checked:bg-primary peer-checked:border-primary group-hover:border-primary/50 flex items-center justify-center">
                        <Check
                            className={`w-3.5 h-3.5 text-white transition-opacity ${props.checked ? 'opacity-100' : 'opacity-0'}`}
                            strokeWidth={4}
                        />
                    </div>
                </div>
                <span className="text-sm text-text-primary select-none group-hover:text-primary transition-colors">
                    {label}
                </span>
            </label>
            {error && <p className="mt-1 text-xs text-red-500 ml-8">{error}</p>}
        </div>
    );
};
