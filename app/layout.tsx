import type { Metadata } from "next";
import { Cinzel, VT323, Outfit } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
});

const vt323 = VT323({
  weight: "400",
  variable: "--font-vt323",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://poka-pocket.ramarijar.my.id"),
  title: "Poka Pocket 🪙 | Pocket Money Tracker",
  description: "Your lovely pocket money tracker - divide your money, set monthly budget limits, and manage your cash flow with a cute, neo-brutalist offline-first PWA dashboard.",
  keywords: [
    "pocket money",
    "tracker",
    "allowance tracker",
    "budget manager",
    "personal finance",
    "pwa budget app",
    "neo-brutalist finance ledger",
    "offline budget tracker"
  ],
  authors: [{ name: "Poka Pocket Team" }],
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192x192.png",
  },
  openGraph: {
    title: "Poka Pocket 🪙 | Pocket Money Tracker",
    description: "Manage your cash flow with a cute, neo-brutalist offline-first PWA dashboard.",
    url: "https://poka-pocket.ramarijar.my.id",
    siteName: "Poka Pocket",
    images: [
      {
        url: "/poka_pocket_logo.png",
        width: 512,
        height: 512,
        alt: "Poka Pocket Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Poka Pocket 🪙 | Pocket Money Tracker",
    description: "Manage your cash flow with a cute, neo-brutalist offline-first PWA dashboard.",
    images: ["/poka_pocket_logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${cinzel.variable} ${vt323.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#090e17" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('SW registered:', reg.scope);
                  }).catch(function(err) {
                    console.log('SW registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-parchment text-dungeon font-sans">
        {children}
      </body>
    </html>
  );
}
