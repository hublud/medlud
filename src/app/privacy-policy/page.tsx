import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-border p-8 sm:p-12">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-text-secondary hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        
        <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary mb-6">Privacy Policy</h1>
        
        <div className="space-y-8 text-text-secondary leading-relaxed">
          <p>Medlud respects your privacy and is committed to protecting your personal and health data.</p>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-text-primary">1. Information We Collect</h2>
            <p>We may collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Personal details (name, email, phone number)</li>
              <li>Health-related information you provide</li>
              <li>Usage data and device information</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-text-primary">2. How We Use Your Information</h2>
            <p>Your data is used to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide healthcare services and AI insights</li>
              <li>Improve platform performance</li>
              <li>Communicate updates and support</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-text-primary">3. Data Protection</h2>
            <p>We implement security measures to protect your data, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encryption</li>
              <li>Secure servers</li>
              <li>Restricted access</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-text-primary">4. Sharing of Information</h2>
            <p>We do not sell your data. We may share information with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Licensed healthcare providers (for consultations)</li>
              <li>Legal authorities when required by law</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-text-primary">5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your data</li>
              <li>Request corrections</li>
              <li>Request deletion (where applicable)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-text-primary">6. Data Retention</h2>
            <p>We retain your data only as long as necessary to provide services and comply with legal obligations.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-text-primary">7. Updates</h2>
            <p>We may update this policy periodically.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
