import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { AdminHeader } from "@/components/admin-header";
import { getSession } from "@/lib/session";
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
  title: "WatchSeeBuy admin",
  description: "Operator console for WatchSeeBuy.",
  robots: { index: false, follow: false },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <div className="shell">
          {session ? <AdminHeader email={session.user.email} /> : null}
          {children}
        </div>
      </body>
    </html>
  );
}
