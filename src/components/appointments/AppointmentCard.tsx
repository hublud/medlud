import React from 'react';
import Link from 'next/link';
import { Calendar, ChevronRight } from 'lucide-react';

export interface AppointmentCase {
    id: string;
    title: string;
    date: string;
    status: 'PENDING' | 'RESPONDED' | 'COMPLETED';
    symptoms: string;
    doctorName?: string;
    doctor?: { full_name: string };
}

interface AppointmentCardProps {
    data: AppointmentCase;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ data }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'RESPONDED': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <Link href={`/dashboard/appointments/${data.id}`} className="block group">
            <div className="bg-white rounded-xl border border-border p-4 hover:shadow-md transition-all duration-200">
                <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border ${getStatusColor(data.status)}`}>
                        {data.status === 'RESPONDED' ? 'doctor / nurse has answered' : data.status}
                    </span>
                    <span className="text-xs text-text-secondary flex items-center">
                        <Calendar size={12} className="mr-1" />
                        {new Date(data.date).toLocaleDateString()}
                    </span>
                </div>

                <h3 className="text-lg font-bold text-text-primary mb-1 group-hover:text-primary transition-colors">
                    {data.title}
                </h3>

                <p className="text-sm text-text-secondary line-clamp-2 mb-4">
                    {data.symptoms}
                </p>

                <div className="flex items-center justify-between text-xs pt-3 border-t border-border">
                    <div className="flex items-center text-text-secondary">
                        {data.doctorName || data.doctor?.full_name ? (
                            <>
                                <span className="font-semibold text-primary">
                                    {data.doctor?.full_name
                                        ? `doctor / nurse ${data.doctor.full_name.split(' ')[0]}`
                                        : data.doctorName}
                                </span>
                            </>
                        ) : (
                            <span className="italic">
                                {data.status === 'COMPLETED' ? 'Case Completed' :
                                    data.status === 'RESPONDED' ? 'Response Received' :
                                        'Waiting for assignment...'}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details <ChevronRight size={14} className="ml-1" />
                    </div>
                </div>
            </div>
        </Link>
    );
};
