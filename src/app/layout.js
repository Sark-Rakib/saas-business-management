import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/contexts/ToastContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "BusinessHub — Business Management SaaS",
    template: "%s | BusinessHub",
  },
  description:
    "Manage your entire business financial activity from one dashboard: sales, expenses, investments, products, transactions, profit & loss, reports and analytics.",
  keywords: [
    "business management",
    "saas",
    "sales tracking",
    "expense management",
    "profit loss",
    "inventory",
    "small business tools",
    "Bangladesh",
    "bKash",
  ],
  openGraph: {
    type: "website",
    title: "BusinessHub — Business Management SaaS",
    description:
      "Manage your entire business financial activity from one dashboard.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    siteName: "BusinessHub",
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}