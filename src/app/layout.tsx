import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Nav } from "@/components/Nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Back2Basics Learn",
  description: "Study app for FAR and contracting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-slate-50">
            <Nav />
            <main className="container mx-auto px-4 py-6">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
