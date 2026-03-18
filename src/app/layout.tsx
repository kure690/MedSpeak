import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'MedSpeak',
  description: 'Translating Care, Connecting Lives.',
  icons: {
    icon: '/medspeak-icon.svg',
    shortcut: '/medspeak-icon.svg',
    apple: '/medspeak-icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
