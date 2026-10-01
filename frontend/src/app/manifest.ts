import type { MetadataRoute } from "next";
import { BRAND_COLOR_HEX } from "@/lib/utils/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "우리집 가계부",
    short_name: "우리집 가계부",
    start_url: "/calendar",
    display: "standalone",
    background_color: BRAND_COLOR_HEX,
    theme_color: BRAND_COLOR_HEX,
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
