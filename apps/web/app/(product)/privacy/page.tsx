import { PrivacyPolicyContent } from "@/components/privacy-policy";

export const metadata = {
  title: "Privacy policy",
  description:
    "How WaitSeeBuy collects, uses, and shares information when you search, watch, and buy.",
};

export default function PrivacyPage() {
  return (
    <main className="page legal-page">
      <h1>Privacy policy</h1>
      <PrivacyPolicyContent />
    </main>
  );
}
