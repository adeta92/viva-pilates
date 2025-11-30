import type { Metadata } from "next";
// Önizleme ortamında hata vermemesi için Next.js font importunu geçici olarak kapattık.
// Kendi projenizde aşağıdaki satırın yorumunu kaldırın:
// import { Inter } from "next/font/google";

// Önizleme ortamında css dosyası bulunamadığı için geçici olarak kapattık.
// Kendi projenizde aşağıdaki satırın yorumunu kaldırın:
// import "./globals.css";

// Önizleme için geçici font sınıfı
const inter = { className: "antialiased" };
// Kendi projenizde üstteki satırı silip alttaki satırı açın:
// const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Viva Da Pilates - Yönetim Paneli",
  description: "Pilates stüdyosu üye ve ders yönetim sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // NOT: Bu önizleme ortamında "validateDOMNesting" hatası almamak için
  // <html> ve <body> etiketleri yerine <div> kullanılmıştır.
  // 
  // PROJENİZİ VERCEL'E YÜKLERKEN BU KISMI ŞÖYLE DEĞİŞTİRİN:
  // return (
  //   <html lang="tr">
  //     <body className={inter.className}>{children}</body>
  //   </html>
  // );
  
  return (
    <div lang="tr" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className={inter.className} style={{ flex: 1 }}>{children}</div>
    </div>
  );
}