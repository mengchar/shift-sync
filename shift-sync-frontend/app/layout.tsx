import type { Metadata } from "next";
import { DM_Sans} from "next/font/google";
import "./globals.css";
import { GoogleOAuthProvider } from '@react-oauth/google';

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
      <body className={`${DM.variable} antialiased`}>
        {/* All Google OAuth logic must happen INSIDE this provider */}
        <GoogleOAuthProvider clientId="909070725371-86mmgrk8l9ajm0n70tipahupq6i9as6s.apps.googleusercontent.com">
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}