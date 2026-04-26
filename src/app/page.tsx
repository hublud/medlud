'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart,
  Shield,
  Stethoscope,
  Brain,
  ArrowRight,
  Play,
  CheckCircle2,
  Activity,
  Users,
  ChevronRight,
  ChevronDown,
  Search,
  Menu,
  X,
  Phone,
  Mail,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [showSupport, setShowSupport] = React.useState(false);

  return (
    <>
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="relative w-8 h-8 sm:w-10 sm:h-10">
                <Image
                  src="/medlud-logo.png"
                  alt="MedLud Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-lg sm:text-xl font-bold text-primary tracking-tight hidden xs:inline">MedLud</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">Features</a>
              <a href="#services" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">Services</a>
              <a href="#about" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">About</a>
              <a href="#support" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">Support</a>
              <a href="#contact" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">Contact</a>
              
              <div className="relative group">
                <button className="flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-primary transition-colors py-2">
                  More <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-200" />
                </button>
                <div className="absolute right-0 top-full mt-0 pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-white rounded-xl shadow-xl border border-border flex flex-col py-2">
                    <Link href="/faqs" className="px-4 py-2 text-sm text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors">FAQs</Link>
                    <Link href="/terms" className="px-4 py-2 text-sm text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors">Terms & Conditions</Link>
                    <Link href="/privacy-policy" className="px-4 py-2 text-sm text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors">Privacy Policy</Link>
                    <Link href="/refund-policy" className="px-4 py-2 text-sm text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors">Refund Policy</Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 sm:space-x-4">
              <Link href="/login">
                <Button variant="outline" size="sm" className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm whitespace-nowrap border-primary/20">Log In</Button>
              </Link>
              <Link href="/welcome">
                <Button variant="primary" size="sm" className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm whitespace-nowrap shadow-md shadow-primary/10">Get Started</Button>
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-1 sm:p-2 text-text-secondary hover:text-primary transition-colors focus:outline-none"
              >
                {isMenuOpen ? <X size={20} className="sm:w-6 sm:h-6" /> : <Menu size={20} className="sm:w-6 sm:h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-border shadow-xl animate-in fade-in slide-in-from-top-4 duration-300 max-h-[calc(100vh-64px)] overflow-y-auto">
            <div className="px-4 pt-2 pb-6 space-y-2">
              <a href="#features" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-text-primary hover:bg-gray-50 rounded-lg">Features</a>
              <a href="#services" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-text-primary hover:bg-gray-50 rounded-lg">Services</a>
              <a href="#about" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-text-primary hover:bg-gray-50 rounded-lg">About</a>
              <a href="#support" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-text-primary hover:bg-gray-50 rounded-lg">Support</a>
              <a href="#contact" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-text-primary hover:bg-gray-50 rounded-lg">Contact</a>
              
              <div className="pt-2 border-t border-border mt-2 mb-2">
                <div className="px-3 py-2 text-xs font-bold text-text-secondary uppercase tracking-wider">More Resources</div>
                <Link href="/faqs" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-text-secondary hover:text-primary hover:bg-gray-50 rounded-lg">FAQs</Link>
                <Link href="/terms" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-text-secondary hover:text-primary hover:bg-gray-50 rounded-lg">Terms & Conditions</Link>
                <Link href="/privacy-policy" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-text-secondary hover:text-primary hover:bg-gray-50 rounded-lg">Privacy Policy</Link>
                <Link href="/refund-policy" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-text-secondary hover:text-primary hover:bg-gray-50 rounded-lg">Refund Policy</Link>
              </div>

              <div className="pt-4 flex flex-col gap-3 border-t border-border">
                <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Log In</Button>
                </Link>
                <Link href="/welcome" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="primary" className="w-full shadow-lg shadow-primary/20">Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-12 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
        <div className="absolute top-0 right-0 -z-10 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent blur-3xl opacity-50" />
        <div className="absolute top-20 left-10 -z-10 w-64 h-64 bg-secondary/5 rounded-full blur-3xl opacity-30 animate-pulse" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 text-center lg:text-left">
            <div className="flex-1 space-y-6 lg:space-y-8 max-w-2xl px-2 sm:px-0">
              <div className="flex items-center gap-2 justify-center lg:justify-start mb-2 animate-in fade-in slide-in-from-bottom-2 duration-700">
                <Image
                  src="/medlud-logo.png"
                  alt="MedLud Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
                <span className="text-2xl font-black text-primary tracking-tighter">MEDLUD</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs sm:text-sm font-semibold animate-in fade-in slide-in-from-bottom-2 duration-700 mx-auto lg:mx-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Health management at your fingertips
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-text-primary leading-tight lg:leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                Empowering Healthcare Through <span className="text-primary italic">Intelligence</span>
              </h1>
              <p className="text-lg sm:text-xl text-text-secondary leading-relaxed max-w-xl mx-auto lg:mx-0 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                Connect with top medical professionals, monitor your health markers, and get instant guidance—all within the MedLud ecosystem.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                <Link href="/welcome" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-lg shadow-xl shadow-primary/30 group">
                    Get Started Now
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-6 text-lg border-2 hover:bg-gray-50 flex items-center justify-center">
                  <Play className="mr-2 w-5 h-5 fill-current text-primary" />
                  Watch Demo
                </Button>
              </div>

              <div className="flex items-center gap-6 justify-center lg:justify-start pt-4 opacity-70">
                <p className="text-sm font-medium text-text-secondary">
                  Trusted by <span className="text-text-primary font-bold">10k+</span> users in Africa
                </p>
              </div>
            </div>

            <div className="flex-1 relative w-full max-w-xl lg:max-w-none animate-in fade-in zoom-in duration-1000 delay-500">
              <div className="relative aspect-[4/3] rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden shadow-2xl border border-white/20 p-4 backdrop-blur-sm">
                <div className="absolute inset-0 bg-white/40 mix-blend-overlay" />
                <div className="relative h-full w-full rounded-2xl bg-white shadow-xl overflow-hidden border border-border">
                  {/* Mock App UI */}
                  <div className="h-full flex flex-col">
                    <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-gray-50/50">
                      <div className="flex items-center gap-3">
                        <Image src="/medlud-logo.png" alt="logo" width={24} height={24} />
                        <div className="h-2 w-24 bg-gray-200 rounded-full" />
                      </div>
                      <Users size={20} className="text-gray-400" />
                    </div>
                    <div className="flex-1 p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-24 rounded-xl bg-primary/5 border border-primary/10 p-4 space-y-2">
                          <Activity className="text-primary w-5 h-5" />
                          <div className="h-1.5 w-12 bg-primary/20 rounded-full" />
                          <div className="h-3 w-16 bg-primary/40 rounded-full" />
                        </div>
                        <div className="h-24 rounded-xl bg-secondary/5 border border-secondary/10 p-4 space-y-2">
                          <Heart className="text-secondary w-5 h-5" />
                          <div className="h-1.5 w-12 bg-secondary/20 rounded-full" />
                          <div className="h-3 w-16 bg-secondary/40 rounded-full" />
                        </div>
                      </div>
                      <div className="h-32 rounded-xl bg-gray-50 border border-border p-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-primary font-bold">ML</div>
                          <div className="space-y-1">
                            <div className="h-2 w-24 bg-gray-300 rounded-full" />
                            <div className="h-1.5 w-16 bg-gray-200 rounded-full" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-2 w-full bg-gray-100 rounded-full" />
                          <div className="h-2 w-4/5 bg-gray-100 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Stats */}
                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-2xl border border-border flex items-center gap-4 animate-bounce duration-[3s]">
                  <div className="bg-emerald-100 p-2 rounded-lg">
                    <CheckCircle2 className="text-emerald-600 w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Profile Status</p>
                    <p className="text-sm font-bold text-text-primary">100% Completed</p>
                  </div>
                </div>

                <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-2xl border border-border flex items-center gap-4 animate-in slide-in-from-top-4 duration-1000">
                  <div className="bg-secondary/10 p-2 rounded-lg">
                    <Shield className="text-secondary w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Security</p>
                    <p className="text-sm font-bold text-text-primary">Verified Account</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 lg:py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-primary font-bold tracking-widest uppercase text-sm">Our Core Services</h2>
            <h3 className="text-4xl font-extrabold text-text-primary">Everything You Need for a Healthier Life</h3>
            <p className="text-text-secondary text-lg leading-relaxed">
              We've combined the power of AI with professional medical expertise to provide a holistic healthcare experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Activity,
                title: 'Appointment Booking',
                description: 'Schedule a virtual consultation with a verified medical expert via our secure chat system.',
                color: 'bg-gold/10 text-gold',
                link: '/appointments'
              },
              {
                icon: Stethoscope,
                title: 'Telemedicine',
                description: 'Consult with licensed nurses and doctors from the comfort of your home via video or voice calls.',
                color: 'bg-secondary/10 text-secondary',
                link: '/telemedicine'
              },
              {
                icon: Brain,
                title: 'AI Health Assistant',
                description: 'Get instant answers to health-related questions with our AI-powered symptoms checker and guidance.',
                color: 'bg-primary/10 text-primary',
                link: '/ai-assistant'
              },
              {
                icon: Heart,
                title: 'Maternal Health',
                description: 'Specialized care and tracking for mothers and newborns, ensuring a safe and healthy journey.',
                color: 'bg-pink-50 text-pink-500',
                link: '/maternal-health'
              },
              {
                icon: Shield,
                title: 'Secure Records',
                description: 'Your medical data is encrypted and stored securely. You always have full ownership of your records.',
                color: 'bg-emerald-50 text-emerald-500',
                link: '#'
              },
              {
                icon: Search,
                title: 'Hospital Finder',
                description: 'Need physical care? Find the nearest verified hospitals and pharmacies in seconds.',
                color: 'bg-blue-50 text-blue-500',
                link: '/hospitals'
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl border border-border hover:border-primary hover:shadow-xl hover:shadow-primary/5 transition-all group">
                <div className={`${feature.color} w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon size={28} />
                </div>
                <h4 className="text-xl font-bold text-text-primary mb-3">{feature.title}</h4>
                <p className="text-text-secondary leading-relaxed mb-6">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 lg:py-24 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-8">
              <h2 className="text-primary font-bold tracking-widest uppercase text-sm">About MedLud</h2>
              <h3 className="text-4xl font-extrabold text-text-primary leading-tight">Bridging the Gap Between You and Quality Care</h3>
              <p className="text-text-secondary text-lg leading-relaxed">
                MedLud was founded with a single mission: to make high-quality healthcare accessible to everyone, regardless of their location or status.
              </p>
              <ul className="space-y-4">
                {[
                  'Accessible medical records for everyone',
                  'Instant connections to licensed specialists',
                  'AI-driven health monitoring and alerts',
                  'Maternal and childcare specialized hub'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="mt-1 bg-primary/10 p-1 rounded-full">
                      <CheckCircle2 size={16} className="text-primary" />
                    </div>
                    <span className="font-medium text-text-primary">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-4">
                <Link href="/welcome">
                  <Button className="px-10 py-4 shadow-xl shadow-primary/20">Join the Revolution</Button>
                </Link>
              </div>
            </div>

            <div className="flex-1 relative w-full mt-12 lg:mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="h-64 rounded-2xl bg-primary/20 relative overflow-hidden shadow-lg">
                    <Image src="https://res.cloudinary.com/datbno9up/image/upload/v1769294277/h_b0zq3q.png" alt="Doctor" fill className="object-cover" />
                  </div>
                  <div className="h-48 rounded-2xl bg-secondary/20 relative overflow-hidden shadow-lg">
                    <Image src="https://res.cloudinary.com/datbno9up/image/upload/v1769293360/cli_kyvsvy.jpg" alt="Consultation" fill className="object-cover" />
                  </div>
                </div>
                <div className="pt-8 space-y-4">
                  <div className="h-48 rounded-2xl bg-gold/20 relative overflow-hidden shadow-lg">
                    <Image src="https://res.cloudinary.com/datbno9up/image/upload/v1769294038/hj_ksibmk.jpg" alt="Technology" fill className="object-cover" />
                  </div>
                  <div className="h-64 rounded-2xl bg-emerald-200 relative overflow-hidden shadow-lg">
                    <Image src="https://res.cloudinary.com/datbno9up/image/upload/v1769293088/hih_exrguq.jpg" alt="Records" fill className="object-cover" />
                  </div>
                </div>
              </div>
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 blur-3xl rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section id="support" className="py-16 lg:py-24 bg-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-primary/10">
            {/* Header */}
            <div className="bg-primary p-8 sm:p-12 text-center text-white">
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 flex items-center justify-center gap-3">
                <span className="text-3xl">💛</span> Support MedLud
              </h2>
              <p className="text-xl sm:text-2xl font-medium opacity-90 max-w-2xl mx-auto mb-6">
                Help Us Make Healthcare Accessible for Everyone
              </p>
              <p className="text-base sm:text-lg text-primary-50 max-w-3xl mx-auto">
                MedLud is building intelligent, life-saving digital healthcare tools for Nigerians and underserved communities. From maternal health support to AI symptom checking, emergency alerts, and telemedicine, our mission is simple:
              </p>
              <p className="text-xl sm:text-2xl font-bold mt-6 text-gold drop-shadow-md bg-white/10 py-3 px-6 rounded-xl inline-block">
                No one should be denied healthcare because of cost.
              </p>
            </div>

            <div className="p-8 sm:p-12 space-y-12">
              {/* Why Your Support Matters */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                  <span className="text-2xl">🌍</span> Why Your Support Matters
                </h3>
                <div className="text-text-secondary space-y-4 leading-relaxed">
                  <p>
                    MedLud is currently funded by <span className="font-semibold text-text-primary">HUBLUD Technology Ltd</span>, the technology company behind this initiative. As we expand across Nigeria, we are committed to ensuring that our healthcare solutions remain affordable and accessible, especially for:
                  </p>
                  <ul className="space-y-3 pl-2 sm:pl-4 border-l-2 border-primary/20">
                    {[
                      'Low-income families',
                      'Rural communities with limited healthcare access',
                      'Pregnant women without consistent medical support',
                      'Individuals who cannot afford private consultations'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 size={20} className="text-primary mt-0.5 shrink-0" />
                        <span className="font-medium text-slate-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="font-medium text-text-primary pt-2">
                    Millions of people delay or avoid treatment simply because they cannot afford it. Through MedLud, we are working to close this gap.
                  </p>
                </div>
              </div>

              {/* Partnership Opportunities */}
              <div className="space-y-6 bg-blue-50/50 p-6 sm:p-8 rounded-2xl border border-blue-100">
                <h3 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                  <span className="text-2xl">🤝</span> Partnership Opportunities for Foundations & NGOs
                </h3>
                <div className="text-text-secondary space-y-4 leading-relaxed">
                  <p>
                    We welcome Foundations, NGOs, Corporate Social Responsibility (CSR) programs, and development organizations to partner with us in subsidizing healthcare access for vulnerable populations.
                  </p>
                  <p className="font-semibold text-text-primary mt-4">Through partnership, organizations can help sponsor:</p>
                  <ul className="grid sm:grid-cols-2 gap-3 pt-2">
                    {[
                      'Medical consultations for low-income individuals and families',
                      'Maternal health monitoring and guidance',
                      'Emergency health alert services',
                      'Telemedicine access to verified doctors and nurses',
                      'Preventive health screening using AI tools'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 bg-white p-3 rounded-xl border border-blue-100/50 shadow-sm hover:shadow-md transition-shadow">
                        <Heart size={18} className="text-blue-500 mt-0.5 shrink-0" />
                        <span className="text-sm font-medium text-slate-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="pt-4 italic">
                    Your organization can directly support communities that need healthcare the most, while leveraging MedLud’s digital platform to deliver scalable impact.
                  </p>
                </div>
              </div>

              {/* How Contributions Help */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                  <span className="text-2xl">✅</span> How Contributions Help
                </h3>
                <div className="text-text-secondary space-y-4">
                  <p>Support from partners and donors helps us:</p>
                  <ul className="grid sm:grid-cols-2 gap-4">
                    {[
                      'Subsidize medical consultations for underserved users',
                      'Expand maternal and emergency health services',
                      'Improve access to verified healthcare professionals'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-sm font-medium text-slate-700">
                        <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Make a Support Contribution */}
              <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-inner">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-text-primary mb-2 flex items-center justify-center gap-2">
                    <span className="text-2xl">❤️</span> Make a Support Contribution
                  </h3>
                  <p className="text-text-secondary mb-6">If you would like to support this mission directly, click the button below to view our bank details.</p>

                  {!showSupport && (
                    <button
                      onClick={() => setShowSupport(true)}
                      className="inline-flex items-center gap-2 bg-primary text-white font-bold px-8 py-4 rounded-full shadow-lg shadow-primary/30 hover:bg-primary/90 hover:scale-105 transition-all text-base"
                    >
                      <span className="text-lg">💳</span> Support Now
                    </button>
                  )}
                </div>

                {showSupport && (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="max-w-md mx-auto space-y-4 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center py-3 border-b border-gray-100 gap-1">
                        <span className="text-sm text-text-secondary font-medium uppercase tracking-wider">Bank Name</span>
                        <span className="font-bold text-text-primary sm:text-right">United Bank For Africa (UBA)</span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center py-3 border-b border-gray-100 gap-1">
                        <span className="text-sm text-text-secondary font-medium uppercase tracking-wider">Account Name</span>
                        <span className="font-bold text-text-primary sm:text-right">HUBLUD TECHNOLOGY LTD</span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center py-3 border-b border-gray-100 gap-1">
                        <span className="text-sm text-text-secondary font-medium uppercase tracking-wider">Account Number</span>
                        <span className="font-mono text-2xl font-black text-primary sm:text-right tracking-tight">1028147083</span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center py-3 gap-1">
                        <span className="text-sm text-text-secondary font-medium uppercase tracking-wider">Currency</span>
                        <span className="font-bold text-text-primary sm:text-right">Nigerian Naira (₦)</span>
                      </div>
                    </div>

                    {/* Follow-up note */}
                    <div className="mt-6 max-w-md mx-auto bg-primary/5 border border-primary/15 rounded-2xl p-5 text-sm text-text-secondary leading-relaxed space-y-3">
                      <p className="font-semibold text-text-primary flex items-center gap-2">
                        <span>📬</span> After supporting, kindly send your:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 font-medium">
                        <li>Full name</li>
                        <li>Payment receipt / proof of transfer</li>
                        <li>Support request or purpose (optional)</li>
                      </ul>
                      <p>To us via:</p>
                      <div className="flex flex-col sm:flex-row gap-3 pt-1">
                        <a href="mailto:support@hublud.com" className="flex items-center gap-2 font-bold text-primary hover:underline">
                          <span>📧</span> support@hublud.com
                        </a>
                        <span className="hidden sm:inline text-gray-300">|</span>
                        <a href="https://wa.me/2349025713908" className="flex items-center gap-2 font-bold text-emerald-600 hover:underline">
                          <span>📱</span> (+234) 9025713908
                        </a>
                      </div>
                    </div>

                    <p className="text-center mt-6 text-sm text-text-secondary font-medium bg-white border border-gray-200 inline-block px-4 py-2 rounded-full mx-auto block w-fit">
                      Every contribution helps extend healthcare access to someone who might otherwise go without care.
                    </p>

                    <div className="text-center mt-4">
                      <button
                        onClick={() => setShowSupport(false)}
                        className="text-xs text-text-secondary hover:text-primary underline transition-colors"
                      >
                        Hide details
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Partner With Us */}
              <div className="text-center space-y-6 pt-4">
                <h3 className="text-2xl font-bold text-text-primary flex items-center justify-center gap-2">
                  <span className="text-2xl">📩</span> Partner With Us
                </h3>
                <p className="text-text-secondary max-w-2xl mx-auto leading-relaxed text-lg">
                  If your foundation, NGO, or organization would like to partner with MedLud to subsidize treatment or consultations for low-income individuals and families, we would love to collaborate.
                </p>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
                  <a href="mailto:support@hublud.com" className="flex items-center gap-3 text-primary font-bold bg-primary/5 hover:bg-primary/10 border border-primary/20 px-8 py-4 rounded-full transition-all hover:scale-105 w-full sm:w-auto justify-center">
                    <span className="text-2xl">📧</span> support@hublud.com
                  </a>
                  <a href="https://wa.me/2349025713908" className="flex items-center gap-3 text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-8 py-4 rounded-full transition-all hover:scale-105 w-full sm:w-auto justify-center">
                    <span className="text-2xl">📱</span> +234 902 571 3908
                  </a>
                </div>
                <p className="text-text-primary font-medium max-w-lg mx-auto pt-4 border-t border-gray-100 mt-6">
                  Together, we can create sustainable programs that ensure more Nigerians receive the healthcare they deserve.
                </p>
              </div>

              {/* Transparency & Trust */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 mt-12 bg-gradient-to-br from-slate-50 to-slate-100">
                <h3 className="text-xl font-bold text-text-primary flex items-center justify-center gap-2 text-center">
                  <span className="text-2xl">🔒</span> Transparency & Trust
                </h3>
                <p className="text-text-secondary text-center max-w-2xl mx-auto">
                  MedLud is developed and maintained by <span className="font-bold text-text-primary">HUBLUD Technology Ltd</span>, a registered technology company committed to ethical and responsible digital healthcare innovation.
                </p>
                <div className="text-center space-y-4 pt-4">
                  <p className="font-semibold text-text-primary text-sm uppercase tracking-wider">We prioritize:</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {['Responsible AI use', 'Medical advisory oversight', 'Secure patient data handling', 'Transparent operational practices'].map((item, i) => (
                      <span key={i} className="bg-white shadow-sm border border-slate-200 text-slate-700 text-sm font-semibold px-4 py-2 rounded-full inline-flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-primary" />
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* A Small Contribution */}
              <div className="bg-primary/5 rounded-3xl p-8 sm:p-12 text-center border border-primary/10 mt-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 -z-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-0 left-0 -z-10 w-64 h-64 bg-gold/10 rounded-full blur-3xl opacity-50" />

                <h3 className="text-2xl sm:text-3xl font-extrabold text-primary mb-8 flex items-center justify-center gap-3">
                  <span className="text-3xl">🌟</span> A Small Contribution Can Save a Life
                </h3>
                <p className="text-text-secondary font-medium mb-6 text-lg">Your support can help:</p>
                <div className="grid sm:grid-cols-3 gap-6 text-center text-text-primary font-bold mb-10">
                  <div className="bg-white p-6 rounded-2xl shadow-md shadow-primary/5 border border-primary/10 flex items-center justify-center">
                    A pregnant mother receive timely guidance
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-md shadow-primary/5 border border-primary/10 flex items-center justify-center">
                    A rural family consult a qualified doctor
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-md shadow-primary/5 border border-primary/10 flex items-center justify-center">
                    Someone get help during a medical emergency
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-text-primary mt-8">
                  Together, we can make healthcare accessible for everyone.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 lg:py-24 bg-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 -z-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-0 right-0 -z-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl opacity-60" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-4">
            <h2 className="text-primary font-bold tracking-widest uppercase text-sm">Get In Touch</h2>
            <h3 className="text-4xl font-extrabold text-text-primary">We&apos;d Love to Hear From You</h3>
            <p className="text-text-secondary text-lg leading-relaxed">
              Have questions, partnership inquiries, or just want to say hi? Reach us through any of the channels below.
            </p>
          </div>

          {/* Contact Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Phone / WhatsApp */}
            <a
              href="https://wa.me/2349025713908"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center text-center bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-emerald-100 hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-xl bg-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md shadow-emerald-200">
                <MessageCircle size={28} className="text-white" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">Call / WhatsApp</p>
              <p className="font-bold text-text-primary text-sm">(+234) 9025713908</p>
            </a>

            {/* Email */}
            <a
              href="mailto:support@hublud.com"
              className="group flex flex-col items-center text-center bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md shadow-primary/20">
                <Mail size={28} className="text-white" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Email Us</p>
              <p className="font-bold text-text-primary text-sm">support@hublud.com</p>
            </a>

            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/company/medlud/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center text-center bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-blue-100 hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-xl bg-[#0A66C2] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md shadow-blue-200">
                <svg viewBox="0 0 24 24" fill="white" width="28" height="28">
                  <path d="M19 3A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H19M18.5 18.5V13.2A3.26 3.26 0 0 0 15.24 9.94C14.39 9.94 13.4 10.46 12.92 11.24V10.13H10.13V18.5H12.92V13.57C12.92 12.8 13.54 12.17 14.31 12.17A1.4 1.4 0 0 1 15.71 13.57V18.5H18.5M6.88 8.56A1.68 1.68 0 0 0 8.56 6.88C8.56 5.95 7.81 5.19 6.88 5.19A1.69 1.69 0 0 0 5.19 6.88C5.19 7.81 5.95 8.56 6.88 8.56M8.27 18.5V10.13H5.5V18.5H8.27Z" />
                </svg>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">LinkedIn</p>
              <p className="font-bold text-text-primary text-sm">MedLud Official</p>
            </a>

            {/* TikTok */}
            <a
              href="https://www.tiktok.com/@medlud_"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center text-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-slate-100 hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-xl bg-black flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md shadow-slate-300">
                <svg viewBox="0 0 24 24" fill="white" width="26" height="26">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.31 6.31 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.77a8.27 8.27 0 0 0 4.83 1.55V6.87a4.85 4.85 0 0 1-1.06-.18z" />
                </svg>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-1">TikTok</p>
              <p className="font-bold text-text-primary text-sm">@medlud_</p>
            </a>
          </div>

          {/* CTA Banner */}
          <div className="bg-gradient-to-r from-primary to-secondary rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
            <h4 className="text-2xl sm:text-3xl font-extrabold mb-3">Ready to transform your healthcare experience?</h4>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of Nigerians already using MedLud for smarter, more accessible healthcare.
            </p>
            <Link href="/welcome">
              <Button
                size="lg"
                className="bg-white !text-primary hover:bg-white/90 font-bold px-10 py-5 text-lg shadow-2xl group"
              >
                Get Started for Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
