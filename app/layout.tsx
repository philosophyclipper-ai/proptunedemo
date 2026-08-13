import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import { SidebarNav } from "@/components/sidebar-nav";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PropTune Demo CRM",
  description: "Demo Scottish estate agency CRM",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-cream text-ink">
        <div className="flex min-h-screen">
          <SidebarNav />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
