import React, { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, hoverable = false }) => {
    const hoverClass = hoverable ? 'hover:shadow-lg hover:scale-[1.02] transition-transform duration-200 cursor-pointer' : '';

    return (
        <div
            className={`bg-white rounded-lg shadow-sm border border-border p-4 ${hoverClass} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};
