import type { NextConfig } from "next";

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

export default nextConfig;
