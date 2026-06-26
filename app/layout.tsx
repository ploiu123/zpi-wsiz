import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ToastProvider } from "@/components/toast";
import { RealtimeClientListener } from "@/components/realtime-client-listener";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin", "latin-ext"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "Złote Miody — Naturalne miody prosto z pasieki",
  description: "Sklep z naturalnymi miodami. Pyłek pszczeli, miód akacjowy, lipowy, faceliowy i więcej. Zamów online z dostawą.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className="dark scroll-smooth" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark light" />
        {/* Blocking script: set theme class BEFORE first paint to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var t = localStorage.getItem('theme');
              if (t === 'light') {
                document.documentElement.classList.remove('dark');
                document.documentElement.classList.add('light');
              } else {
                document.documentElement.classList.remove('light');
                document.documentElement.classList.add('dark');
              }
            } catch(e) {}
            if (typeof navigator !== 'undefined' && (navigator.userAgent.toLowerCase().includes('electron') || navigator.userAgent.toLowerCase().includes('zlotemiodyapp'))) {
              document.documentElement.classList.add('is-electron');
            }
          })();
        `}} />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-[#0a0a0a] text-white antialiased`}>
        <ToastProvider>
          <RealtimeClientListener />
          <Navbar />
          <main className="min-h-screen"><a href="#main-content" className="skip-link">Przejdź do treści</a>
        <main id="main-content" role="main" className="page-enter flex-grow">
          {children}
        </main></main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
