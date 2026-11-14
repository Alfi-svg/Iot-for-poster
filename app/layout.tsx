import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'CarbonMRV Bangladesh | Unified IoT-ML dMRV Framework',
  description:
    'Research dashboard for ecosystem-specific carbon stock estimation, predictive uncertainty quantification, adaptive sampling, and auditable dMRV in Bangladesh.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-slate-50 antialiased font-sans text-slate-900">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
