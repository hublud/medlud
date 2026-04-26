import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-border p-8 sm:p-12">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-text-secondary hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        
        <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary mb-6">Terms and Conditions</h1>
        
        <div className="space-y-8 text-text-secondary leading-relaxed">
          <p>Welcome to Medlud, a product of HUBLUD Technology Limited. By accessing or using our platform, you agree to the following terms:</p>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-text-primary">1. Use of the Platform</h2>
            <p>Medlud provides AI-assisted health information and telemedicine services. By using our platform, you agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Use the platform only for lawful purposes</li>
              <li>Not misuse or attempt to disrupt the system</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-text-primary">2. Medical Disclaimer</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Medlud does not replace professional medical advice, diagnosis, or treatment</li>
              <li>AI-generated insights are for informational purposes only</li>
              <li>Always consult a licensed healthcare provider for medical concerns</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-text-primary">3. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You are responsible for maintaining the confidentiality of your account</li>
              <li>Any activity under your account is your responsibility</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-text-primary">4. Doctor-Patient Interaction</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Medlud facilitates communication but does not directly provide medical services</li>
              <li>Healthcare providers are solely responsible for their consultations and decisions</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-text-primary">5. Intellectual Property</h2>
            <p>All content, software, and branding on Medlud are owned by HUBLUD Technology Limited and may not be copied or reused without permission.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-text-primary">6. Limitation of Liability</h2>
            <p>Medlud is not liable for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Any medical decisions made based on platform usage</li>
              <li>Service interruptions or technical issues</li>
              <li>Loss of data due to unforeseen circumstances</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-text-primary">7. Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these terms.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-text-primary">8. Changes to Terms</h2>
            <p>We may update these terms at any time. Continued use of the platform means you accept the updated terms.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
