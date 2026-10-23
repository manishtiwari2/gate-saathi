import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { themeInitScript } from "@/components/layout/ThemeToggle";
import { Providers } from "@/components/Providers";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "GATE Saathi — Study for GATE with Friends | Free PYQs & Mock Tests",
    template: "%s | GATE Saathi",
  },
  description:
    "GATE prep with friends: previous-year questions, practice papers, AI doubt help and study rooms to stay on track together.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <Providers>
          <SiteNav />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
