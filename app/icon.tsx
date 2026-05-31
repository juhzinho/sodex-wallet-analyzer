import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1a1a1a",
          borderRadius: 6,
        }}
      >
        <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
          {/* Cube top */}
          <polygon points="50,6 90,27 50,48 10,27" fill="#3a3a3a" />
          {/* Cube left */}
          <polygon points="10,27 50,48 50,94 10,73" fill="#2a2a2a" />
          {/* Cube right */}
          <polygon points="90,27 50,48 50,94 90,73" fill="#323232" />
          {/* S top bar */}
          <rect x="30" y="18" width="30" height="10" fill="white" />
          {/* S top-left vertical */}
          <rect x="30" y="18" width="10" height="20" fill="white" />
          {/* S middle bar */}
          <rect x="30" y="38" width="30" height="10" fill="white" />
          {/* S bottom-right vertical */}
          <rect x="50" y="38" width="10" height="20" fill="white" />
          {/* S bottom bar */}
          <rect x="30" y="48" width="30" height="10" fill="white" />
          {/* Orange accent */}
          <rect x="60" y="28" width="10" height="10" fill="#E84532" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
