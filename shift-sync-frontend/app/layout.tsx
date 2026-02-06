import type { Metadata } from "next";
import { DM_Sans} from "next/font/google";
import "./globals.css";

const DM = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shift Sync",
  description: "Sync shifts to Google Calendar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${DM.variable} ${DM.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
