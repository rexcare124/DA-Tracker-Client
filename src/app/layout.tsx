import type { Metadata } from "next";
import "./globals.css";
// import Providers from "./providers";
import { Toaster } from "@/components/ui/sonner";
import Providers from "./providers";
import SessionProviders from "./SessionProviders";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import ConsoleFilter from "@/components/ConsoleFilter";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "DA Tracker",
  description:
    "Join the movement for government transparency and accountability. Recognizing exceptional government leaders and holding accountable those who discharge their duties wastefully, inefficiently, or recklessly.",
  keywords:
    "government, transparency, accountability, reform, California, public service",
  authors: [{ name: "DATracker" }],
  openGraph: {
    title: "DA Tracker",
    description:
      "Join the movement for government transparency and accountability.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={` antialiased`} suppressHydrationWarning>
        <ConsoleFilter />
        <GoogleAnalytics />
        <SessionProviders>
          <Providers>
            <Navigation />
            {children}
          </Providers>
        </SessionProviders>
        <Toaster closeButton />
      </body>
    </html>
  );
}
