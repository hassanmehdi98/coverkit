import type { MetadataRoute } from "next";

import { APP_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep /img/ crawlable — social platform bots must fetch the render endpoint.
      disallow: ["/dashboard", "/api/", "/t/"],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
