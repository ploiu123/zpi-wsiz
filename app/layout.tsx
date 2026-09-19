import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ToastProvider } from "@/components/toast";
import { RealtimeClientListener } from "@/components/realtime-client-listener";
import { CartAuthSync } from "@/components/cart-auth-sync";
import { RecoveryRedirect } from "@/components/recovery-redirect";

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
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var t = localStorage.getItem('theme');
              if (t !== 'light' && t !== 'dark') {
                t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
              }
              document.documentElement.classList.toggle('light', t === 'light');
              document.documentElement.classList.toggle('dark', t === 'dark');
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
          <CartAuthSync />
          <RecoveryRedirect />
          <a href="#main-content" className="skip-link">Przejdź do treści</a>
          <Navbar />
          <main id="main-content" className="min-h-screen page-enter flex-grow">
            {children}
          </main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
