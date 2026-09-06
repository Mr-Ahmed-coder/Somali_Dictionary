const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }]
      }
    ];
  },
  async redirects() {
    const canonicalHost = "https://www.somali-dictionary.com";

    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "somali-dictionary.com" }],
        destination: `${canonicalHost}/:path*`,
        permanent: true
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "somali-dictionary-client.vercel.app" }],
        destination: `${canonicalHost}/:path*`,
        permanent: true
      }
    ];
  }
};

export default nextConfig;
