import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { AdblockBanner } from "@/components/adblock-banner";
import { Header } from "@/components/header";
import "./globals.css";

const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "WaitSeeBuy",
  description: "Wait for the right collectible. See the sold price. Then buy.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <div className="shell">
          <Header />
          <AdblockBanner />
          {children}
          <footer>
            WaitSeeBuy is an independent product. If you buy through our links,
            we may earn a commission from the eBay Partner Network. That does
            not change the price you pay.
          </footer>
        </div>
      </body>
    </html>
  );
}
