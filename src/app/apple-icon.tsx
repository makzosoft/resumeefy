import { ImageResponse } from "next/og";
import { MARK_ICON } from "@/lib/assets";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MARK_ICON} width={180} height={180} alt="" />
      </div>
    ),
    size
  );
}
