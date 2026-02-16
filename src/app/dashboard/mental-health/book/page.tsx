import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Star, Video } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function BookMentalHealthPage() {
    const professionals = [
        {
            id: '1',
            name: 'Dr. Adebayo Ogunleye',
            title: 'Clinical Psychologist',
            specialty: 'Anxiety, Depression, Trauma',
            rating: 4.9,
            consultations: 200,
            available: true
        },
        {
            id: '2',
            name: 'Dr. Chioma Nwosu',
            title: 'Psychiatrist',
            specialty: 'Mood Disorders, Medication Management',
            rating: 4.8,
            consultations: 150,
            available: true
        },
        {
            id: '3',
            name: 'Mrs. Fatima Ibrahim',
            title: 'Licensed Counselor',
            specialty: 'Stress Management, Relationships',
            rating: 4.7,
            consultations: 180,
            available: false
        }
    ];

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

                {/* Navigation */}
                <div>
                    <Link
                        href="/dashboard/mental-health"
                        className="inline-flex items-center gap-2 text-text-secondary hover:text-primary transition-colors mb-4 group"
                    >
                        <div className="p-2 rounded-full bg-white border border-border group-hover:bg-primary/5 transition-colors">
                            <ArrowLeft size={20} />
                        </div>
                        <span className="font-medium hidden sm:inline-block">Back to Mental Health</span>
                    </Link>
                </div>

                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-text-primary">Book Mental Health Consultation</h1>
                    <p className="text-text-secondary">Connect with licensed mental health professionals</p>
                </div>

                {/* Professionals List */}
                <div className="space-y-4">
                    {professionals.map((prof) => (
                        <div
                            key={prof.id}
                            className={`bg-white rounded-xl border border-border p-5 ${prof.available ? 'hover:shadow-md cursor-pointer' : 'opacity-60'
                                } transition-all`}
                        >
                            <div className="flex items-start gap-4">
                                <div className="bg-purple-100 p-3 rounded-full flex-shrink-0">
                                    <User size={24} className="text-purple-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-text-primary">{prof.name}</h4>
                                        {prof.available && (
                                            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                                                Available
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm font-medium text-purple-600 mb-1">{prof.title}</p>
                                    <p className="text-sm text-text-secondary mb-3">{prof.specialty}</p>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-1">
                                            <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                            <span className="font-medium text-text-primary">{prof.rating}</span>
                                        </div>
                                        <span className="text-text-secondary">{prof.consultations}+ consultations</span>
                                    </div>
                                </div>
                                {prof.available && (
                                    <Link href="/dashboard/appointments/book?category=mental-health">
                                        <Button size="sm">
                                            <Calendar size={16} className="mr-2" />
                                            Book Now
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Info Box */}
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-5">
                    <h3 className="font-bold text-purple-900 mb-3">What to Expect</h3>
                    <ul className="space-y-2 text-sm text-purple-700">
                        <li className="flex items-start gap-2">
                            <Video size={16} className="mt-0.5 flex-shrink-0" />
                            <span>Private video or chat consultation</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-600">•</span>
                            <span>45-60 minute session</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-600">•</span>
                            <span>Professional assessment and care plan</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-600">•</span>
                            <span>Follow-up recommendations</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-600">•</span>
                            <span>Completely confidential</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
