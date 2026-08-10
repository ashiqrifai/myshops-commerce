import type {
  Metadata,
} from "next";

import {
  Toaster,
} from "sonner";

import StoreProvider from "@/store/StoreProvider";

import "./globals.css";

export const metadata:
  Metadata = {
  title:
    "MyShops Admin",

  description:
    "Administration panel for MyShops Commerce Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children:
    React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          

          {children}

          <Toaster
            position="top-right"
            richColors
            closeButton
          />
        </StoreProvider>
      </body>
    </html>
  );
}