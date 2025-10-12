import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "X Reply Optimizer | Built on X's Open Algorithm",
  description: "Optimize your X posts and replies using the exact weights from Twitter/X's recommendation algorithm. Grow from 3 to 250 followers in 30 days.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <header className="border-b">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold">X Reply Optimizer</h1>
                  <p className="text-xs text-muted-foreground">
                    Built on X&apos;s Open Source Algorithm
                  </p>
                </div>
                <Navigation />
                <div className="text-right">
                  <p className="text-sm font-medium">Goal: 3 → 250 Followers</p>
                  <p className="text-xs text-muted-foreground">0 → 50 SubWise Users | 30 Days</p>
                </div>
              </div>
            </div>
          </header>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
