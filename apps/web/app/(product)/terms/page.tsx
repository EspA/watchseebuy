import { TermsOfServiceContent } from "@/components/terms-of-service";

export const metadata = {
  title: "Terms of service",
  description:
    "Terms for using WaitSeeBuy search, watches, alerts, and affiliate buy links.",
};

export default function TermsPage() {
  return (
    <main className="page legal-page">
      <h1>Terms of service</h1>
      <TermsOfServiceContent />
    </main>
  );
}
