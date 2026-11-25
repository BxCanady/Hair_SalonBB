import type { Metadata, Viewport } from "next";
import MobileNav from "@/components/ui/MobileNav";
import RegisterSW from "@/components/RegisterSW";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beast@Braid",
  description: "Book hair salon appointments and manage the salon schedule.",
  manifest: "/manifest.json",
  applicationName: "Beast@Braid",
  icons: {
    icon: [
      { url: "/favicon_io/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon_io/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon_io/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon_io/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon_io/favicon.ico",
    apple: "/favicon_io/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Beast@Braid",
    statusBarStyle: "black-translucent",
  },
  other: {
    "msapplication-TileColor": "#050505",
    "msapplication-TileImage": "/favicon_io/mstile-150x150.png",
    "msapplication-config": "/browserconfig.xml",
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="flex min-h-full flex-col">
        <div className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">{children}</div>
        <MobileNav />
        <RegisterSW />
      </body>
    </html>
  );
}
