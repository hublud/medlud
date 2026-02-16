import React from 'react';

interface ToggleProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    description?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ label, checked, onChange, description }) => {
    return (
        <div className="flex items-center justify-between py-4">
            <div className="flex flex-col">
                <span className="text-sm font-medium text-text-primary">{label}</span>
                {description && <span className="text-xs text-text-secondary pr-4">{description}</span>}
            </div>

            <button
                type="button"
                className={`${checked ? 'bg-primary' : 'bg-gray-200'
                    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
            >
                <span
                    aria-hidden="true"
                    className={`${checked ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
            </button>
        </div>
    );
};
