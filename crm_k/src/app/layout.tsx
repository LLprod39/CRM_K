import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/ui/Navigation";
import MobileNavigation from "@/components/ui/MobileNavigation";
import MobileHeader from "@/components/ui/MobileHeader";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider, ToastProvider } from "@/presentation/contexts";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRM_K - Система управления учениками",
  description: "CRM система для управления учениками, расписанием и финансами",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CRM_K",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "CRM_K",
    "application-name": "CRM_K",
    "msapplication-TileColor": "#667eea",
    "msapplication-config": "/browserconfig.xml",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#667eea",
  colorScheme: "light",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <AuthProvider>
            <ToastProvider>
              <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 lg:block hidden transition-all duration-300">
                <Navigation />
                <main className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-8">
                  <div className="animate-fade-in">
                    {children}
                  </div>
                </main>
              </div>
              
              {/* Мобильная версия */}
              <div className="min-h-screen lg:hidden">
                <MobileHeader />
                <main className="mobile-main-content mobile-scroll">
                  <div className="animate-mobile-fade-in">
                    {children}
                  </div>
                </main>
                <MobileNavigation />
              </div>
            </ToastProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
