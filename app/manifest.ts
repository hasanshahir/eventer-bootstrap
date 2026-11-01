import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Eventr — Pakistan’s Developer & Tech Event Hub",
    short_name: "Eventr PK",
    description:
      "Every hackathon, developer conference, workshop, and meetup across Pakistan. Curated by city, sorted by registration deadlines.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
    ],
  };
}

