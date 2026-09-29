import type { CSSProperties } from "react";

interface SkelProps {
  w?: string | number;
  h?: number;
  r?: number;
  className?: string;
}

export function Skel({ w = "100%", h = 12, r = 8, className }: SkelProps) {
  const style = {
    "--skel-w": typeof w === "number" ? `${w}px` : w,
    "--skel-h": `${h}px`,
    "--skel-r": `${r}px`,
  } as CSSProperties;

  return <div className={`ab-skel${className ? ` ${className}` : ""}`} style={style} />;
}
