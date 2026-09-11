"use client";

import type { ComponentProps } from "react";

import type { SmileIdVersion } from "@/lib/smile-id/legacy";

import { LegacySmileIdCapture } from "./LegacySmileIdCapture";
import { SmileIdCapture } from "./SmileIdCapture";

/**
 * The identity check, on whichever Smile ID integration the console chose.
 *
 * `v3` — the default, and what every caller got before this existed — renders
 * `SmileIdCapture` exactly as before. `legacy` renders the v11 JavaScript SDK
 * capture instead. The version comes from the server, which also refuses a
 * capture from the integration that is not selected, so a stale page cannot
 * push a job through the other path.
 */
export function IdentityCapture({
  version = "v3",
  ...props
}: ComponentProps<typeof SmileIdCapture> & { version?: SmileIdVersion }) {
  return version === "legacy" ? (
    <LegacySmileIdCapture {...props} />
  ) : (
    <SmileIdCapture {...props} />
  );
}
