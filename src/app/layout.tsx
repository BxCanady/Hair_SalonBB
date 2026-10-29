import type { Metadata, Viewport } from "next";
import MobileNav from "@/components/ui/MobileNav";
import RegisterSW from "@/components/RegisterSW";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beast@Braid",
  description: "Book hair salon appointments and manage the salon schedule.",
  manifest: "/manifest.json",
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
  appleWebApp: { capable: true, title: "Beast@Braid" },
};

export const viewport: Viewport = { themeColor: "#7c3aed" };

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
