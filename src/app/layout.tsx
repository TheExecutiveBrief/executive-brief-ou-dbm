import type { Metadata, Viewport } from "next";
import { Playfair_Display, Newsreader, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SiteShell from "@/components/layout/SiteShell";
import TopUtilityBar from "@/components/layout/TopUtilityBar";
import Masthead from "@/components/layout/Masthead";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#FAF7F2",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://executivebrief.oudbm.ac.in"),
  title: "The Executive Brief | Department of Business Management, Osmania University",
  description:
    "The flagship digital journal and executive publication of the Newsletter & Media Club, Department of Business Management (OU DBM), Osmania University. Covering business strategy, regional economies, campus leadership, academic research, and executive careers.",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "OU DBM",
    "Osmania University MBA",
    "The Executive Brief",
    "Hyderabad Business Journal",
    "Management Review",
    "Telangana GCCs",
    "Executive Careers",
    "OU Business Management",
  ],
  authors: [{ name: "Newsletter & Media Club, OU DBM" }],
  openGraph: {
    title: "The Executive Brief — OU DBM",
    description: "The Premier Digital Business Journal of Osmania University MBA (DBM).",
    url: "https://executivebrief.oudbm.ac.in",
    siteName: "The Executive Brief",
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${newsreader.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans bg-paper text-ink min-h-screen flex flex-col antialiased selection:bg-crimson-light selection:text-crimson-900">
        <SiteShell
          header={
            <header className="w-full bg-paper border-b border-editorial-border">
              <TopUtilityBar />
              <Masthead />
              <Navigation />
            </header>
          }
          footer={<Footer />}
        >
          {children}
        </SiteShell>
      </body>
    </html>
  );
}
