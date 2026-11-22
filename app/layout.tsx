import type { Metadata } from 'next';
import React from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'QuantaV — Intelligence, without friction',
  description:
    'QuantaV is a premium AI chatbot powered by Groq. Elegant, fast, and distraction-free.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        {/* Anti-flash script for instant theme resolution */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=JSON.parse(localStorage.getItem('quantav-theme')||'"system"');var r=t==='system'?(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):t;document.documentElement.setAttribute('data-theme',r)}catch(e){document.documentElement.setAttribute('data-theme','dark')}})();`,
          }}
        />
      </head>
      <body className="h-full overflow-hidden bg-background text-foreground antialiased select-auto">
        {children}
      </body>
    </html>
  );
}
