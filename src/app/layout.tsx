import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Header } from "@/components/header";
import { Providers } from "@/components/providers";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = process.env.APP_URL ?? "https://coverkit.dev";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "CoverKit",
  description:
    "Design Open Graph templates and generate cover images from a URL.",
  openGraph: {
    title: "CoverKit",
    description:
      "Every page deserves its own social card. Design one template — every page gets a card, automatically.",
    url: appUrl,
    siteName: "CoverKit",
    type: "website",
    images: [
      {
        url: "/img/site.png",
        width: 1200,
        height: 630,
        alt: "CoverKit — Every page deserves its own social card",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CoverKit",
    description:
      "Every page deserves its own social card. Design one template — every page gets a card, automatically.",
    images: ["/img/site.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-zinc-900">
        <Providers>
          <Header />
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
