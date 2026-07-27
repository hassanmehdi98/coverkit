import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Required for the production Docker image (Phase 5)
  output: "standalone",
  // Serve /img/:id.png via the /img/[templateId] route handler
  async rewrites() {
    return [
      {
        source: "/img/:templateId.png",
        destination: "/img/:templateId",
      },
    ];
  },
  // Ensure resvg native bindings are not bundled incorrectly
  serverExternalPackages: ["@resvg/resvg-js"],
};

const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;

export default withSentryConfig(nextConfig, {
  // Source-map upload is optional — skip entirely when the token is absent
  // so local/CI builds never fail for missing Sentry credentials.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: sentryAuthToken,
  sourcemaps: {
    disable: !sentryAuthToken,
  },
  silent: !process.env.CI,
});
