import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    fullWidth?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-primary text-white hover:bg-opacity-90 focus:ring-primary',
        secondary: 'bg-secondary text-white hover:bg-opacity-90 focus:ring-secondary',
        accent: 'bg-accent text-white hover:bg-opacity-90 focus:ring-accent',
        outline: 'border border-border text-text-primary hover:bg-gray-50 focus:ring-primary',
        ghost: 'text-text-primary hover:bg-gray-100 focus:ring-gray-400',
        danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : leftIcon ? (
                <span className="mr-2">{leftIcon}</span>
            ) : null}

            {children}

            {!isLoading && rightIcon && (
                <span className="ml-2">{rightIcon}</span>
            )}
        </button>
    );
};
