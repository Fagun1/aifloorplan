"use client";

import dynamic from "next/dynamic";

const StudioLayout = dynamic(
  () => import("@/studio/StudioLayout").then((m) => ({ default: m.StudioLayout })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAFAF8",
        }}
      >
        Loading Studio...
      </div>
    ),
  }
);

export default function StudioRoute() {
  return <StudioLayout />;
}
