import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'QuantaV — Intelligence, without friction',
  description:
    'QuantaV is a premium AI chatbot powered by Groq. Elegant, fast, and distraction-free.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=JSON.parse(localStorage.getItem('quantav-theme')||'"system"');var r=t==='system'?(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):t;document.documentElement.setAttribute('data-theme',r)}catch(e){document.documentElement.setAttribute('data-theme','dark')}})();`,
          }}
        />
      </head>
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
