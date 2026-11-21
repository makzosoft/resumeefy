import { ImageResponse } from "next/og";
import { MARK_ICON } from "@/lib/assets";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

// The Resumeefy R on a white tile, used as the browser tab icon.
export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MARK_ICON} width={64} height={64} alt="" />
      </div>
    ),
    size
  );
}
