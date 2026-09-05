import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const config: NextConfig = {
  agentRules: false,
  transpilePackages: [
    "@veylo/api-client",
    "@veylo/backend",
    "@veylo/contracts",
    "@veylo/ui-web",
    "@veylo/design-tokens",
  ],
  poweredByHeader: false,
  devIndicators: false,
  serverExternalPackages: ["@google/genai"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(self)" },
        ],
      },
    ];
  },
};

export default withWorkflow(config);
