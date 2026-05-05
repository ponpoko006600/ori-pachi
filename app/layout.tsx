import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PachiSpec - 夢のパチンコスペックを作ろう",
  description: "オリジナルパチンコ台のスペックを作成・シミュレート・共有できるサイト",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
