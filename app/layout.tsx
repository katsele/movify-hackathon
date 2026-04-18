import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SidebarNav } from "@/components/SidebarNav";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Azimuth · Skills Demand Forecaster",
  description:
    "Skills demand forecasting for Belgian digital consultancies — predict the skill-mix your clients will buy in the next 3–6 months by fusing CRM pipeline with external market signals.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased bg-neutral-50 text-neutral-700">
        <Providers>
          <div className="flex h-screen w-screen overflow-hidden">
            <SidebarNav />
            <main className="flex-1 overflow-y-auto">
              <div className="max-w-[1440px] mx-auto px-6 py-6">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
