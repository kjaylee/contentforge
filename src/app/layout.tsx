import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
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
  title: "ContentForge - 블로그 하나로 SNS 10개 정복",
  description: "블로그 하나 던지면 SNS 10개 나온다. 트위터, 링크드인, 인스타, 페북, 스레드로 30초 만에 변환.",
  keywords: ["콘텐츠 리퍼포징", "SNS 자동화", "블로그 변환", "AI 콘텐츠", "소셜 미디어"],
  openGraph: {
    title: "ContentForge - 블로그 하나로 SNS 10개 정복",
    description: "블로그 하나 던지면 SNS 10개 나온다. 30초 만에 변환.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
