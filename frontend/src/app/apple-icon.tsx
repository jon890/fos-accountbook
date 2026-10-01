import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// ADR-F36: --color-brand-500을 sRGB로 변환한 값이다.
const brandColorHex = "#3289fc";
const fontData = readFile(
  join(
    process.cwd(),
    "node_modules/pretendard/dist/public/static/Pretendard-Bold.otf",
  ),
);

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: brandColorHex,
          color: "white",
          display: "flex",
          fontSize: 104,
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
