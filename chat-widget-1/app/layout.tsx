import type { Metadata } from "next";
import "./globals.css";
import {
  Inter,
  Roboto,
  Open_Sans,
  Lato,
  Montserrat,
  Poppins,
  Source_Sans_3,
} from "next/font/google";
import ReduxProvider from "@/lib/redux-provider";
import { LanguageProvider } from "@/context/language-context";

export const metadata: Metadata = {
  title: "Kogents Chat",
  description: "Kogents Chat",
};

// --- Google Font Imports ---
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const roboto = Roboto({ subsets: ["latin"], variable: "--font-roboto" });
const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
});
const lato = Lato({
  subsets: ["latin"],
  variable: "--font-lato",
  weight: ["400", "700"],
});
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});
const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "700"],
});
const sourceSansPro = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans-pro",
  weight: ["400", "700"],
});

// --- Font Composition ---
const fontClasses = [
  inter.variable,
  roboto.variable,
  openSans.variable,
  lato.variable,
  montserrat.variable,
  poppins.variable,
  sourceSansPro.variable,
].join(" ");

// --- Font Stack (Google + System) ---
const fontStack = [
  "var(--font-inter)",
  "var(--font-roboto)",
  "var(--font-open-sans)",
  "var(--font-lato)",
  "var(--font-montserrat)",
  "var(--font-poppins)",
  "var(--font-source-sans-pro)",
  "Arial",
  "Helvetica",
  "sans-serif",
].join(", ");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // --- Runtime Guard for Third-party Scripts ---
  if (typeof window !== "undefined") {
    const forbiddenScripts = [
      "kogents-chat-widget",
      // Add other script IDs to monitor if needed
    ];
    forbiddenScripts.forEach((id) => {
      if (document.getElementById(id)) {
        // Optional: Remove detected scripts if necessary
        // document.getElementById(id)?.remove(); // Commented out for safety
        console.warn(
          `Third-party script '${id}' detected in RootLayout. Avoid injecting here; use child pages/components instead.`
        );
      }
    });
  }

  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <ReduxProvider>{children}</ReduxProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
