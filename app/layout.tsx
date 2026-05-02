import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Family Car Calendar",
  description: "Simple shared car reservation calendar"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
