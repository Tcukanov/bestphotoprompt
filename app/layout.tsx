import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Header } from '@/components/Header';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BestPhotoPrompt - Viral AI Image Prompts',
  description:
    'Discover the best AI image prompts. Midjourney, SDXL, Flux, Stable Diffusion prompts curated daily from Reddit and X.',
  keywords: ['AI prompts', 'Midjourney', 'SDXL', 'Flux', 'Stable Diffusion', 'AI art'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </main>
          </div>
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                fontSize: '14px',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
