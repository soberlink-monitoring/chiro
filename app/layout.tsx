import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chiropractor Sign Up | Soberlink",
  description: "Book your appointment with Dr. John",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
