import React from 'react';
import { MessageCircle, Mail, Phone } from 'lucide-react';

export const SupportCard: React.FC = () => {
    return (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full">
                        <MessageCircle size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-white">Customer Support</h2>
                        <p className="text-emerald-100 text-xs">We're here to help, 24/7</p>
                    </div>
                </div>
            </div>

            <div className="p-5 space-y-3">
                {/* Call / WhatsApp */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors group">
                    <div className="bg-green-100 p-2 rounded-full flex-shrink-0 group-hover:bg-green-200 transition-colors">
                        <Phone size={16} className="text-green-600" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Call / WhatsApp</p>
                        <a
                            href="tel:09025713908"
                            className="font-bold text-gray-900 text-sm hover:text-green-600 transition-colors"
                        >
                            090 2571 3908
                        </a>
                    </div>
                    <a
                        href="https://wa.me/2349025713908"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto flex-shrink-0 bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors"
                    >
                        WhatsApp
                    </a>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors group">
                    <div className="bg-blue-100 p-2 rounded-full flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                        <Mail size={16} className="text-blue-600" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Support Email</p>
                        <a
                            href="mailto:medlud@hublud.com"
                            className="font-bold text-gray-900 text-sm hover:text-blue-600 transition-colors truncate block"
                        >
                            medlud@hublud.com
                        </a>
                    </div>
                </div>


            </div>
        </div>
    );
};
