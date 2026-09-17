import type {
  Metadata,
} from "next";

import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import {
  Suspense,
} from "react";

import StoreProvider from "@/store/StoreProvider";

import NavigationLoader from "@/components/storefront/NavigationLoader";

import "./globals.css";

const geistSans = Geist({
  variable:
    "--font-geist-sans",

  subsets: [
    "latin",
  ],

  display:
    "swap",
});

const geistMono =
  Geist_Mono({
    variable:
      "--font-geist-mono",

    subsets: [
      "latin",
    ],

    display:
      "swap",
  });

const siteUrl =
  process.env
    .NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3001";

export const metadata: Metadata = {
  metadataBase:
    new URL(
      siteUrl
    ),

  title: {
    default:
      "MyShops",

    template:
      "%s | MyShops",
  },

  description:
    "Shop electronics, technology and accessories from MyShops UAE.",

  applicationName:
    "MyShops",

  robots: {
    index:
      true,

    follow:
      true,
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
          {/*
           * Current route/page remains
           * rendered normally.
           */}
          {children}

          {/*
           * Navigation loader sits on top
           * of the current page.
           *
           * No white/grey background.
           */}
          <Suspense
            fallback={
              null
            }
          >
            <NavigationLoader />
          </Suspense>
        </StoreProvider>
      </body>
    </html>
  );
}