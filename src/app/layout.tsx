import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Footer } from '@/components/ui/Footer';
import { AuthProvider } from '@/context/AuthContext';
import GlobalErrorSuppressor from '@/components/GlobalErrorSuppressor';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'MedLud - Empowering Healthcare Through Intelligence',
  description: 'A healthcare application for easy and accessible medical support.',
  icons: {
    icon: '/medlud-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased font-sans bg-background text-text-primary flex flex-col min-h-screen`}>
        <AuthProvider>
          <GlobalErrorSuppressor />
          <main className="flex-1 w-full">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
