'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Building2, Stethoscope } from 'lucide-react';

export default function NearbyHospitalsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pb-20 animate-in fade-in duration-500">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">

                {/* Navigation */}
                <div className="mb-8">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors group"
                    >
                        <div className="p-2 rounded-full bg-white border border-gray-200 group-hover:border-blue-200 shadow-sm transition-all">
                            <ArrowLeft size={20} />
                        </div>
                        <span className="font-medium">Back to Dashboard</span>
                    </Link>
                </div>

                {/* Main Content Card */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-white/50 backdrop-blur-sm">
                    <div className="relative h-48 bg-gradient-to-r from-blue-600 to-indigo-600 overflow-hidden">
                        <div className="absolute inset-0 opacity-20">
                            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                        </div>
                        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute -top-12 -left-12 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

                        <div className="relative h-full flex items-center justify-center">
                            <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-lg animate-bounce-slow">
                                <Building2 size={48} className="text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="px-8 py-12 text-center space-y-6">
                        <div className="space-y-2">
                            <div className="inline-block px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-bold tracking-wide uppercase mb-2">
                                In Development
                            </div>
                            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                                Nearby Hospitals & Clinics
                            </h1>
                            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                                We're building a comprehensive directory of verified healthcare facilities near you.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-12 mb-12">
                            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-200 transition-colors group">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform text-blue-600">
                                    <MapPin size={24} />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">Real-time GPS</h3>
                                <p className="text-sm text-gray-500">Instant routing to the nearest open facility based on your live location.</p>
                            </div>
                            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-green-200 transition-colors group">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform text-green-600">
                                    <Stethoscope size={24} />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">Verified Specialists</h3>
                                <p className="text-sm text-gray-500">Filter by specialty to find exactly the care you need.</p>
                            </div>
                            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-purple-200 transition-colors group">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform text-purple-600">
                                    <Building2 size={24} />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">Partner Network</h3>
                                <p className="text-sm text-gray-500">Direct integration with top hospitals for wait times and booking.</p>
                            </div>
                        </div>


                    </div>
                </div>

                <p className="text-center text-gray-400 text-sm mt-8">
                    Need immediate help? Use the Emergency SOS button below.
                </p>
            </div>
        </div>
    );
}
