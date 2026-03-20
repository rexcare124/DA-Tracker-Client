import type { NextConfig } from "next";

// Suppress baseline-browser-mapping warnings
process.env.BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA = "true";
process.env.BROWSERSLIST_IGNORE_OLD_DATA = "true";

// Intercept console.warn to filter out known harmless warnings
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  const message = String(args[0] || "");

  // Suppress baseline-browser-mapping warnings
  if (message.includes("baseline-browser-mapping") && message.includes("over two months old")) {
    return;
  }

  // Suppress Facebook XSS security warnings (harmless, expected behavior)
  if (
    message.includes("This is a browser feature intended for developers") ||
    message.includes("facebook.com/selfxss") ||
    (message.includes("Stop!") && message.includes("Facebook"))
  ) {
    return;
  }

  // Suppress Permissions Policy violations for unload (deprecated event, coming from third-party SDKs)
  if (message.includes("Permissions policy violation") && message.includes("unload")) {
    return;
  }

  originalWarn.apply(console, args);
};

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "platform-lookaside.fbsbx.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.licdn.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "example.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.builder.io",
        port: "",
        pathname: "/**",
      },
    ],
  },
  // Disable request logging to prevent OAuth authorization codes from appearing in terminal
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  // Proxy /api/data-types and /api/smrc to Express server
  async rewrites() {
    const apiServer = process.env.API_SERVER_URL || "http://localhost:5000";
    return [
      { source: "/api/data-types", destination: `${apiServer}/api/data-types` },
      { source: "/api/data-types/:path*", destination: `${apiServer}/api/data-types/:path*` },
      { source: "/api/smrc", destination: `${apiServer}/api/smrc` },
      { source: "/api/smrc/:path*", destination: `${apiServer}/api/smrc/:path*` },
    ];
  },
  // Suppress development server request logs for OAuth callbacks
  onDemandEntries: {
    // Reduce log verbosity
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Configure HTTP headers globally
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            // Allow camera and microphone for same-origin (video testimonial). Allow unload for SDKs.
            value: "camera=(self), microphone=(self), unload=*, geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
