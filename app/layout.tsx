import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { ImpersonationBanner } from "@/components/shared/ImpersonationBanner";
import { APP_NAME } from "@/config/constants";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Production-ready Next.js SaaS boilerplate",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} min-h-screen font-sans antialiased`}>
        <AuthSessionProvider>
          <ImpersonationBanner />
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
