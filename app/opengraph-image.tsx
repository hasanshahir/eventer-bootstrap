import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Eventr — Pakistan's Developer & Tech Event Hub";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#09090b",
          color: "#f8fafc",
          padding: "64px",
          border: "8px solid #2563eb",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "2px solid #27272a",
            paddingBottom: "20px",
            fontSize: "20px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#3b82f6",
            fontWeight: 700,
          }}
        >
          <span>EVENTR PAKISTAN • NATIONAL TECH RADAR</span>
          <span>20 REGIONAL DESKS</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div
            style={{
              fontSize: "88px",
              fontWeight: 800,
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
            }}
          >
            Har event, har shehar.
          </div>
          <div
            style={{
              fontSize: "30px",
              color: "#94a3b8",
              maxWidth: "900px",
              lineHeight: 1.35,
            }}
          >
            Pakistan&apos;s deadline-first field guide to hackathons, conferences,
            campus competitions, and developer meetups.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "2px solid #27272a",
            paddingTop: "20px",
            fontSize: "18px",
            color: "#cbd5e1",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          <span>KARACHI • LAHORE • ISLAMABAD • PESHAWAR • MULTAN • ONLINE</span>
          <span style={{ color: "#3b82f6", fontWeight: 700 }}>
            EVENTR.PK
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

