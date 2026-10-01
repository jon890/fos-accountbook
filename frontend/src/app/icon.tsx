import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BRAND_COLOR_HEX } from "@/lib/utils/brand";

const fontData = readFile(
  join(
    process.cwd(),
    "node_modules/pretendard/dist/public/static/Pretendard-Bold.otf",
  ),
);

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: BRAND_COLOR_HEX,
          color: "#ffffff",
          display: "flex",
          fontSize: 288,
          fontWeight: 700,
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        가
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          data: await fontData,
          name: "Pretendard",
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}
