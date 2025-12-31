import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Suspense } from "react";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Jalanea Lab - Private Command Center",
  description: "Personal internal hub for managing projects, experiments, and tools",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-lab-bg text-lab-text`}
      >
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-lab-bg">
            <div className="w-8 h-8 border-2 border-lab-accent border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          {children}
        </Suspense>
      </body>
    </html>
  );
}
