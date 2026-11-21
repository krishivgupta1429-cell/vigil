import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import BottomNav from "@/components/BottomNav";
import QuickExit from "@/components/QuickExit";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vigil",
  description: "Prevent. Protect. Prove. A safety companion for streets, rides, home, campus and online.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
  appleWebApp: { capable: true, title: "Vigil", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0B1026",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <QuickExit />
        <div className="mx-auto min-h-dvh w-full max-w-[480px] bg-night sm:border-x sm:border-edge">
          <main className="px-5 pb-28 pt-16">{children}</main>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
