import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/panel/", "/admin/", "/api/"],
      },
    ],
    sitemap: "https://trustfxpro.com.tr/sitemap.xml",
    host: "https://trustfxpro.com.tr",
  };
}
