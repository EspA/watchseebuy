import { AdblockBanner } from "@/components/adblock-banner";
import { Header } from "@/components/header";

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="shell">
      <Header />
      <AdblockBanner />
      {children}
      <footer>
        WaitSeeBuy is an independent product. If you buy through our links, we
        may earn a commission from the eBay Partner Network. That does not
        change the price you pay.
      </footer>
    </div>
  );
}
