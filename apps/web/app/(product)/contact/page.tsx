import { ContactForm } from "@/components/contact-form";

export const metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <main className="page contact-page">
      <h1>Contact Us</h1>
      <ContactForm />
    </main>
  );
}
