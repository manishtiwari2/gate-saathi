import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern use of GATE Saathi.",
};

export default function TermsPage() {
  return <LegalPage file="terms.txt" title="Terms of Service" />;
}
