import type {
  Metadata,
} from "next";

import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import StoreProvider from "@/store/StoreProvider";

import "./globals.css";

const geistSans = Geist({
  variable:
    "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono =
  Geist_Mono({
    variable:
      "--font-geist-mono",
    subsets: ["latin"],
    display: "swap",
  });

const siteUrl =
  process.env
    .NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3001";

export const metadata: Metadata = {
  metadataBase:
    new URL(siteUrl),

  title: {
    default: "MyShops",
    template:
      "%s | MyShops",
  },

  description:
    "Shop electronics, technology and accessories from MyShops UAE.",

  applicationName:
    "MyShops",

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children:
    React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
