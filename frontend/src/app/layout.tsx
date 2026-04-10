import type { Metadata } from "next";
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "CourseFlow",
  description: "Modern campus and institutional management platform",
  icons: {
    icon: "/brand-icon.ico",
  },
};

import { GoogleOAuthProvider } from "@react-oauth/google";

import FetchInterceptor from "@/components/FetchInterceptor";

import Navbar from "@/components/Navbar";
import ThemeHandler from "@/components/ThemeHandler";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "PLACEHOLDER_GOOGLE_CLIENT_ID";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} h-full antialiased selection:bg-primary/30 selection:text-primary-light transition-colors duration-500`}
    >
      <body className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden transition-colors duration-500">
        <Providers>
          <ThemeHandler />
          <FetchInterceptor />
          <GoogleOAuthProvider clientId={clientId}>
            <Navbar />
            {children}
          </GoogleOAuthProvider>
        </Providers>
      </body>
    </html>
  );
}
