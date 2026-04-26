import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-border p-8 sm:p-12">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-text-secondary hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        
        <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary mb-6">Refund Policy</h1>
        
        <div className="space-y-8 text-text-secondary leading-relaxed">
          <p>At Medlud, we aim to provide high-quality services. This policy outlines when refunds may apply.</p>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-text-primary">1. Eligibility for Refunds</h2>
            <p>Refunds may be considered if:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>A payment was made in error</li>
              <li>A service was not delivered due to a system failure</li>
              <li>Duplicate charges occurred</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-text-primary">2. Non-Refundable Services</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Completed consultations</li>
              <li>Services already rendered by healthcare professionals</li>
              <li>Subscription periods already used</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-text-primary">3. Request Process</h2>
            <p>To request a refund:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Contact us within 7 days of the transaction</li>
              <li>Provide proof of payment and reason for request</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-text-primary">4. Processing Time</h2>
            <p>Approved refunds will be processed within 7–14 business days.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-text-primary">5. Payment Method</h2>
            <p>Refunds will be issued using the original payment method where possible.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
