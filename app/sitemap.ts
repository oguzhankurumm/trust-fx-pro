import { MetadataRoute } from "next";

const BASE_URL = "https://trustfxpro.com.tr";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,                              lastModified: new Date(), changeFrequency: "daily",   priority: 1.0  },
    { url: `${BASE_URL}/piyasa`,                  lastModified: new Date(), changeFrequency: "always",  priority: 0.9  },
    { url: `${BASE_URL}/trading`,                 lastModified: new Date(), changeFrequency: "always",  priority: 0.9  },
    { url: `${BASE_URL}/limitler`,                lastModified: new Date(), changeFrequency: "monthly", priority: 0.7  },
    { url: `${BASE_URL}/promosyonlar`,            lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7  },
    { url: `${BASE_URL}/hakkimizda`,              lastModified: new Date(), changeFrequency: "monthly", priority: 0.6  },
    { url: `${BASE_URL}/iletisim`,                lastModified: new Date(), changeFrequency: "monthly", priority: 0.6  },
    { url: `${BASE_URL}/sss`,                     lastModified: new Date(), changeFrequency: "monthly", priority: 0.6  },
    { url: `${BASE_URL}/giris`,                   lastModified: new Date(), changeFrequency: "monthly", priority: 0.5  },
    { url: `${BASE_URL}/kayit`,                   lastModified: new Date(), changeFrequency: "monthly", priority: 0.5  },
    { url: `${BASE_URL}/sartlar`,                 lastModified: new Date(), changeFrequency: "yearly",  priority: 0.4  },
    { url: `${BASE_URL}/gizlilik`,                lastModified: new Date(), changeFrequency: "yearly",  priority: 0.4  },
    { url: `${BASE_URL}/risk-bildirimi`,          lastModified: new Date(), changeFrequency: "yearly",  priority: 0.4  },
  ];

  return staticRoutes;
}
