import { ImageResponse } from "next/og";

import { siteContent } from "@/content/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${siteContent.name} — ${siteContent.role}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#fbfbfa",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 76, fontWeight: 600, color: "#1a1a19" }}>
          {siteContent.name}
        </div>
        <div style={{ height: 6, width: 96, background: "#1f5f8b", margin: "28px 0" }} />
        <div style={{ fontSize: 34, color: "#5b5b57", lineHeight: 1.35 }}>
          {siteContent.headline}
        </div>
      </div>
    ),
    size,
  );
}
