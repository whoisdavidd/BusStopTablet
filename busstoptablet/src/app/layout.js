import { Geist, Geist_Mono } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css"; // ✅ Bootstrap CSS only
import "./globals.css";
import BootstrapClient from "./component/BootstrapClient"; // ✅ Load Bootstrap JS via client component

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Bus Stop Tablet",
  description: "Bus Service Finder",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <BootstrapClient />  {/* ✅ Load Bootstrap JS here */}
      </body>
    </html>
  );
}