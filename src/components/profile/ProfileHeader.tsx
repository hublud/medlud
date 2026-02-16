import React from 'react';
import { User, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ProfileHeaderProps {
    name: string;
    role: string;
    medludId: string;
    isVerified?: boolean;
    avatarUrl?: string; // Optional for now
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
    name,
    role,
    medludId,
    isVerified = false,
    avatarUrl
}) => {
    return (
        <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white rounded-xl shadow-sm border border-border">
            <div className="relative">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary border-4 border-white shadow-md">
                    {avatarUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={avatarUrl} alt={name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <User size={40} />
                    )}
                </div>
                {isVerified && (
                    <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full border-2 border-white" title="Verified Account">
                        <CheckCircle2 size={16} />
                    </div>
                )}
            </div>

            <div className="text-center sm:text-left space-y-1">
                <h1 className="text-2xl font-bold text-text-primary">{name}</h1>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-text-secondary">
                    <span className="bg-primary/5 text-primary px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide">
                        {role}
                    </span>
                    <span className="text-sm">•</span>
                    <span className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                        MED-ID: {medludId}
                    </span>
                </div>
                {isVerified ? (
                    <p className="text-xs text-blue-600 font-medium flex items-center justify-center sm:justify-start gap-1 mt-1">
                        <ShieldCheck size={12} /> Verified Account
                    </p>
                ) : (
                    <p className="text-xs text-orange-500 font-medium mt-1">
                        Pending Verification
                    </p>
                )}
            </div>
        </div>
    );
};
