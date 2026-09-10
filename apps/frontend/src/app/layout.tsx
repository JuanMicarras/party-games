import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Party Games',
  description: 'Real-time party games platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased bg-slate-900 text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}