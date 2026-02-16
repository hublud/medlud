import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: SelectOption[];
    error?: string;
    fullWidth?: boolean;
    leftIcon?: React.ElementType;
}

export const Select: React.FC<SelectProps> = ({
    label,
    options,
    error,
    fullWidth = false,
    className = '',
    required,
    leftIcon: LeftIcon,
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
                <select
                    className={`appearance-none block w-full border ${error ? 'border-red-500' : 'border-border'} bg-white rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${LeftIcon ? 'pl-10' : ''}`}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-text-secondary" />
                </div>
            </div>
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
};
