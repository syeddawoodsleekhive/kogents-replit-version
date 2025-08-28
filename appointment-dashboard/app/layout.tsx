import {
  Inter,
  Roboto,
  Open_Sans,
  Lato,
  Montserrat,
  Poppins,
  Source_Sans_3,
} from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import ReduxProvider from "@/utils/redux-provider";

// Optimize font loading - only load essential fonts with proper display
const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: "swap",
  preload: true
});

const roboto = Roboto({ 
  subsets: ["latin"], 
  variable: "--font-roboto",
  display: "swap",
  preload: true
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
  preload: false // Load on demand
});

const lato = Lato({
  subsets: ["latin"],
  variable: "--font-lato",
  weight: ["400", "700"],
  display: "swap",
  preload: false
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  preload: false
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "700"],
  display: "swap",
  preload: false
});

const sourceSansPro = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans-pro",
  weight: ["400", "700"],
  display: "swap",
  preload: false
});

// Memoize font classes to prevent unnecessary recalculations
const fontClasses = [
  inter.variable,
  roboto.variable,
  openSans.variable,
  lato.variable,
  montserrat.variable,
  poppins.variable,
  sourceSansPro.variable,
].join(" ");

// Optimize font stack with fallbacks
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
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={fontClasses} style={{ fontFamily: fontStack }}>
        <ReduxProvider>
          <UserProvider>{children}</UserProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}

export const metadata = {
  title: "Chat Dashboard",
  generator: "v0.dev",
  description: "Chat Dashboard",
  icons: {
    icon: "/favicon.png",
  },
};
