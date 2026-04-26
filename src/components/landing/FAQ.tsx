'use client';

import React, { useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';

const faqs = [
    {
        question: "What exactly is Medlud?",
        answer: "Medlud is an intelligent healthcare platform designed to make medical care accessible to everyone. We combine AI-driven health guidance with direct access to licensed medical professionals, ensuring you get the right care at the right time."
    },
    {
        question: "How do I consult with a doctor on the platform?",
        answer: "Once you sign up, you can book a consultation directly from your dashboard. You can choose from specialized chat sessions, voice calls, or video consultations depending on your preference and the nature of your concern."
    },
    {
        question: "Is my medical information kept private and secure?",
        answer: "Yes, security is our top priority. We use industry-standard encryption to protect all your health records and personal data. Your information is only accessible to you and the medical professionals you choose to consult with."
    },
    {
        question: "How much does a consultation cost?",
        answer: "Consultation fees vary depending on the type of specialist you are seeing. You can view all pricing transparently before booking, and payments can be made easily using your Medlud wallet."
    },
    {
        question: "Can I use Medlud for medical emergencies?",
        answer: "Medlud is excellent for guidance, follow-ups, and non-emergency consultations. However, in cases of life-threatening emergencies, we strongly advise you to visit the nearest physical hospital immediately."
    },
    {
        question: "Does Medlud offer laboratory services?",
        answer: "Yes, our doctors can issue laboratory requests through the platform which you can take to any of our partner labs or a lab near you. Results can then be uploaded back to your profile for your doctor to review."
    }
];

export const FAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section id="faq" className="py-20 bg-white">
            <div className="max-w-4xl mx-auto px-4">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-primary font-bold tracking-widest uppercase text-sm">Common Questions</h2>
                    <h3 className="text-4xl font-extrabold text-text-primary">Frequently Asked Questions</h3>
                    <p className="text-text-secondary text-lg px-4">
                        Everything you need to know about navigating the Medlud ecosystem.
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div 
                            key={index}
                            className={`border border-border rounded-2xl overflow-hidden transition-all duration-300 ${openIndex === index ? 'shadow-lg border-primary/20' : 'hover:border-primary/20 bg-gray-50/30'}`}
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full flex items-center justify-between p-6 text-left focus:outline-none bg-inherit"
                            >
                                <span className="text-lg font-bold text-text-primary pr-3 flex-1">{faq.question}</span>
                                <ChevronDown 
                                    className={`text-primary shrink-0 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`} 
                                    size={20} 
                                />
                            </button>
                            
                            <div 
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                            >
                                <div className="p-6 pt-0 text-text-secondary leading-relaxed border-t border-border/10 bg-white/50">
                                    {faq.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16 p-8 bg-primary/5 rounded-3xl border border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
                    <div className="text-center sm:text-left">
                        <h4 className="text-xl font-bold text-text-primary mb-1">Still have questions?</h4>
                        <p className="text-text-secondary">Our team is here to help you get the most out of Medlud.</p>
                    </div>
                    <a 
                        href="https://wa.me/2349025713908" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-emerald-500 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 hover:scale-105 transition-all text-base whitespace-nowrap"
                    >
                        <MessageCircle size={22} className="fill-current" />
                        Chat on WhatsApp
                    </a>
                </div>
            </div>
        </section>
    );
};
