import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { SidebarNav } from "@/components/SidebarNav";

export const metadata: Metadata = {
  title: "Movify · Skills Demand Forecaster",
  description:
    "Predict which skills Movify clients will need in 3–6 months from CRM pipeline + external market signals.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#F9FAFB] text-foreground">
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
