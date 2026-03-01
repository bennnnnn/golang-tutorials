import { ImageResponse } from "next/og";
import { getTutorialBySlug } from "@/lib/tutorials";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tutorial = getTutorialBySlug(slug);
  const title = tutorial?.title ?? "Go Tutorial";

  return new ImageResponse(
    <div
      style={{
        background: "linear-gradient(135deg, #0891b2 0%, #164e63 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        fontFamily: "sans-serif",
        padding: "80px",
      }}
    >
      <div
        style={{
          fontSize: 24,
          color: "rgba(255,255,255,0.6)",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        🐹 uByte
      </div>
      <div
        style={{
          fontSize: 72,
          fontWeight: "bold",
          color: "white",
          letterSpacing: "-2px",
          lineHeight: 1.1,
          maxWidth: 900,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 28, color: "rgba(255,255,255,0.7)", marginTop: "24px" }}>
        Free interactive Go tutorial
      </div>
    </div>,
    size
  );
}
