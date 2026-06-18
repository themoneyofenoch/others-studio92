import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Studio 92 Braids — Dallas Braid & Loc Studio",
  description: "Dallas-based braids & locs studio specializing in knotless box braids, goddess braids, lemonade feed-in braids, loc retwists & more. Book online in seconds.",
  keywords: ["Dallas braids", "knotless braids Dallas", "box braids", "loc retwist", "Studio 92", "lemonade braids", "boho braids"],
  authors: [{ name: "Studio 92 Braids" }],
  openGraph: {
    title: "Studio 92 Braids — Dallas Braid & Loc Studio",
    description: "Tension-free knotless braids, goddess braids, loc retwists and more. North Dallas braid studio — book online.",
    siteName: "Studio 92 Braids",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
        </Providers>
        <Toaster />
        <SonnerToaster position="top-right" />
      </body>
    </html>
  );
}
