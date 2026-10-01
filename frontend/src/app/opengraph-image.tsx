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

export const alt = "우리집 가계부: 가족이 함께 쓰는 가계부";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: brandColorHex,
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 700 }}>우리집 가계부</div>
        <div style={{ fontSize: 42, marginTop: 28 }}>가족이 함께 쓰는 가계부</div>
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
