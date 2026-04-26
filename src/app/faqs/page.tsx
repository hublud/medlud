'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { FAQ } from '@/components/landing/FAQ';

export default function FAQsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          href="/" 
          className="inline-flex items-center text-sm font-semibold text-text-secondary hover:text-primary transition-all group"
        >
          <div className="mr-2 bg-gray-50 p-2 rounded-lg group-hover:bg-primary/10 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Home
        </Link>
      </div>

      {/* FAQ Component */}
      <div className="-mt-12">
        <FAQ />
      </div>

      {/* Footer Decoration */}
      <div className="py-20 bg-gray-50/50">
        <div className="max-w-4xl mx-auto px-4 text-center">
            <p className="text-sm text-text-secondary font-medium">
                © 2026 Medlud. Building a future where healthcare works for everyone.
            </p>
        </div>
      </div>
    </div>
  );
}
