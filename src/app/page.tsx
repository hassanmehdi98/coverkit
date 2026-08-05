import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/LandingPage";
import {
  APP_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  TWITTER_URL,
} from "@/lib/seo";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: SITE_NAME,
      url: APP_URL,
      email: "hello@coverkit.dev",
      sameAs: [TWITTER_URL],
    },
    {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      applicationCategory: "DesignApplication",
      operatingSystem: "Web",
      url: APP_URL,
      description: SITE_DESCRIPTION,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  );
}
