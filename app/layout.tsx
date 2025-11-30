import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // BU SATIR EKSİKTİ, ARTIK VAR ✅

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Viva Da Pilates - Yönetim Paneli",
  description: "Pilates stüdyosu üye ve ders yönetim sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
