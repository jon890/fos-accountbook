import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "우리집 가계부",
    short_name: "우리집 가계부",
    start_url: "/calendar",
    display: "standalone",
    background_color: "#3289fc",
    theme_color: "#3289fc",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
