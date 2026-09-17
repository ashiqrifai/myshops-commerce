import type { Metadata } from "next";
import ContactPage from "@/components/storefront/contact/ContactPage";

export const metadata: Metadata = {
  title: "Contact Us | MyShops",
  description: "Contact MyShops UAE, find our store locations, and get help from our customer support team.",
};

export default function ContactUsPage() {
  return <ContactPage />;
}
