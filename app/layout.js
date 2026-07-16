import { Manrope } from "next/font/google";
import "./globals.css";
import SWRegister from "@/components/sw-register";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-manrope",
});

export const metadata = {
  title: "TeleKas",
  description: "Dashboard keuangan pribadi dari TeleKas Bot",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TeleKas",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon-192.png",
  },
};

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`dark ${manrope.variable}`}>
      <body className="font-sans">
        {children}
        <SWRegister />
      </body>
    </html>
  );
}
