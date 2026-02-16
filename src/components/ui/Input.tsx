import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: LucideIcon;
    rightIcon?: LucideIcon;
    fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    fullWidth = false,
    className = '',
    required,
    ...props
}) => {
    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <div className={`mb-4 input-wrapper ${widthClass} ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-text-primary mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative">
                {LeftIcon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                        <LeftIcon className="h-5 w-5" />
                    </div>
                )}
                <input
                    className={`block w-full border ${error ? 'border-red-500' : 'border-border'} rounded-lg px-3 py-2 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${LeftIcon ? 'pl-10' : ''} ${RightIcon ? 'pr-10' : ''}`}
                    {...props}
                />
                {RightIcon && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-text-secondary">
                        <RightIcon className="h-5 w-5" />
                    </div>
                )}
            </div>
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
};
