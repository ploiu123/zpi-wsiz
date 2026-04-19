import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

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
    <html lang="pl" className="scroll-smooth">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          if (typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron')) {
            document.documentElement.classList.add('is-electron');
          }
        `}} />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-[#0a0a0a] text-white antialiased`}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
