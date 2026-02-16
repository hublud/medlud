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
  Search,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

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
              <a href="#donate" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">Donate</a>
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
          <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-border shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="px-4 pt-2 pb-6 space-y-2">
              <a href="#features" onClick={() => setIsMenuOpen(false)} className="block px-3 py-4 text-base font-medium text-text-primary hover:bg-gray-50 rounded-lg">Features</a>
              <a href="#services" onClick={() => setIsMenuOpen(false)} className="block px-3 py-4 text-base font-medium text-text-primary hover:bg-gray-50 rounded-lg">Services</a>
              <a href="#about" onClick={() => setIsMenuOpen(false)} className="block px-3 py-4 text-base font-medium text-text-primary hover:bg-gray-50 rounded-lg">About</a>
              <a href="#donate" onClick={() => setIsMenuOpen(false)} className="block px-3 py-4 text-base font-medium text-text-primary hover:bg-gray-50 rounded-lg">Donate</a>
              <div className="pt-4 flex flex-col gap-3">
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
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 relative overflow-hidden">
                      <Image src={`https://i.pravatar.cc/100?u=${i}`} alt="user" fill />
                    </div>
                  ))}
                </div>
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
                icon: Brain,
                title: 'AI Health Assistant',
                description: 'Get instant answers to health-related questions with our AI-powered symptoms checker and guidance.',
                color: 'bg-primary/10 text-primary',
                link: '/ai-assistant'
              },
              {
                icon: Stethoscope,
                title: 'Telemedicine',
                description: 'Consult with licensed nurses and doctors from the comfort of your home via video or voice calls.',
                color: 'bg-secondary/10 text-secondary',
                link: '/telemedicine'
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
              },
              {
                icon: Activity,
                title: 'Appointment Booking',
                description: 'Skip the queues. Book and manage your medical appointments effortlessly with our intuitive system.',
                color: 'bg-gold/10 text-gold',
                link: '/appointments'
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

      {/* Donation Section */}
      <section id="donate" className="py-16 lg:py-24 bg-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-primary/10">
            <div className="bg-primary p-8 sm:p-12 text-center text-white">
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">💛 Support MedLud</h2>
              <p className="text-xl sm:text-2xl font-medium opacity-90 max-w-2xl mx-auto">
                Help Us Make Healthcare Accessible for Everyone
              </p>
            </div>

            <div className="p-8 sm:p-12 space-y-12">
              <div className="text-center space-y-6">
                <p className="text-lg text-text-secondary leading-relaxed">
                  MedLud is building intelligent, life-saving digital healthcare tools for Nigerians and underserved communities.
                  From maternal health support to AI symptom checking, emergency alerts, and telemedicine — our mission is simple:
                </p>
                <p className="text-xl font-bold text-primary">
                  No one should be denied healthcare because of cost.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                    <span className="text-2xl">🌍</span> Why Your Support Matters
                  </h3>
                  <div className="text-text-secondary space-y-4">
                    <p>
                      MedLud is currently fully funded by <span className="font-semibold text-text-primary">HUBLUD Technology Ltd</span>.
                      As we expand, we are committed to making this solution affordable — especially for:
                    </p>
                    <ul className="space-y-2 pl-2">
                      {['Low-income families', 'Rural communities', 'Pregnant women without access to regular care', 'Individuals who cannot afford private consultation'].map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 size={18} className="text-primary mt-1 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                    <span className="text-2xl">✅</span> Your Donation Helps Us
                  </h3>
                  <ul className="space-y-3 text-text-secondary">
                    {[
                      'Subsidize consultations for low-income users',
                      'Support maternal and emergency health features',
                      'Maintain secure servers and AI infrastructure',
                      'Improve access to verified doctors and nurses',
                      'Continue building safe, ethical AI healthcare tools'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 size={18} className="text-emerald-500 mt-1 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 border border-gray-200">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-text-primary mb-2">❤️ Make a Donation</h3>
                  <p className="text-text-secondary">If you would like to support this mission, kindly make a transfer to:</p>
                </div>

                <div className="max-w-md mx-auto space-y-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-text-secondary font-medium">Bank Name</span>
                    <span className="font-bold text-text-primary text-right">United Bank For Africa (UBA)</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-text-secondary font-medium">Account Name</span>
                    <span className="font-bold text-text-primary text-right">HUBLUD TECHNOLOGY LTD</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-text-secondary font-medium">Account Number</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xl font-bold text-primary">1028147083</span>
                      {/* Could add copy button here in future */}
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-text-secondary font-medium">Currency</span>
                    <span className="font-bold text-text-primary">Nigerian Naira (₦)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                  <div className="inline-block bg-primary/10 px-4 py-1.5 rounded-full text-primary font-bold text-sm mb-2">
                    🤝 Transparency & Trust
                  </div>
                  <p className="text-text-secondary text-sm">
                    Medlud is developed and maintained by <span className="font-bold">HUBLUD Technology Ltd</span>, a registered technology company committed to ethical and responsible digital healthcare innovation. We are dedicated to responsible AI use, medical advisory oversight, secure data handling, and transparent operations.
                  </p>
                </div>

                <div className="bg-primary/5 rounded-2xl p-8 text-center">
                  <h3 className="text-xl font-bold text-primary mb-4">🌟 A Small Gift Can Save a Life</h3>
                  <div className="grid sm:grid-cols-3 gap-4 text-center text-text-secondary font-medium">
                    <p>You help a mother get guidance.</p>
                    <p>You help someone access emergency care.</p>
                    <p>You help someone feel safe.</p>
                  </div>
                  <p className="mt-6 text-lg font-bold text-text-primary">Thank you for believing in this vision.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Donation Section */}

    </>
  );
}
