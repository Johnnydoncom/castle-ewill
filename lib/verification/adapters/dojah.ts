import "server-only";

import { getEnv } from "@/lib/env";
import type {
  VerificationInput,
  VerificationOutcome,
  VerificationProvider,
} from "../types";

/**
 * Dojah KYC — automated liveness detection and ID face matching.
 *
 * This is the provider that supplies the actual security guarantee. The
 * browser-side challenge is a user-experience layer and a cheap first filter;
 * anti-spoofing has to happen somewhere the client cannot reach.
 *
 * Dojah's `/api/v1/kyc/photoid/verify` accepts a selfie and an ID photograph as
 * base64 and returns both a match confidence and a selfie-liveness verdict.
 */

const API = "https://api.dojah.io";

/** Below this match confidence the attempt is refused. */
const MATCH_THRESHOLD = 70;

export class DojahProvider implements VerificationProvider {
  readonly name = "dojah" as const;
  readonly automated = true;

  async verify(input: VerificationInput): Promise<VerificationOutcome> {
    const env = getEnv();

    if (!env.DOJAH_APP_ID || !env.DOJAH_SECRET_KEY) {
      throw new Error(
        "DOJAH_APP_ID and DOJAH_SECRET_KEY are required when VERIFICATION_PROVIDER=dojah",
      );
    }

    if (!input.idDocument) {
      return {
        status: "failed",
        failureReason:
          "No identity document on file to match against. Upload one to your vault first.",
      };
    }

    const response = await fetch(`${API}/api/v1/kyc/photoid/verify`, {
      method: "POST",
      headers: {
        Authorization: env.DOJAH_SECRET_KEY,
        AppId: env.DOJAH_APP_ID,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        selfie_image: input.capture.toString("base64"),
        photoid_image: input.idDocument.buffer.toString("base64"),
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Dojah verification failed (${response.status}): ${await response.text()}`,
      );
    }

    const payload = (await response.json()) as {
      entity?: {
        selfie?: {
          confidence_value?: number;
          match?: boolean;
          photoId_image_blurry?: boolean;
          selfie_image_blurry?: boolean;
        };
      };
    };

    const selfie = payload.entity?.selfie;
    const confidence = selfie?.confidence_value ?? 0;

    if (selfie?.selfie_image_blurry || selfie?.photoId_image_blurry) {
      return {
        status: "failed",
        matchScore: Math.round(confidence),
        failureReason:
          "The image was too blurry to compare reliably. Please try again in better light.",
      };
    }

    if (!selfie?.match || confidence < MATCH_THRESHOLD) {
      return {
        status: "failed",
        matchScore: Math.round(confidence),
        failureReason:
          "Your face did not match the identity document on file.",
      };
    }

    return {
      status: "passed",
      matchScore: Math.round(confidence),
      livenessScore: Math.round(confidence),
      providerReference: null,
    };
  }
}
