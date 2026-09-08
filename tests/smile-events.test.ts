import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CAPTURE_CLOSED,
  CAPTURE_PUBLISHED,
  CONSENT_DENIED,
  CONSENT_GRANTED,
} from "@/lib/smile-id/elements";

/**
 * Where Smile ID's events actually dispatch — pinned, because the docs are
 * wrong about the one that matters.
 *
 * Their setup page states flatly that every component event dispatches on
 * `window`, and lists "listener attached to the element" as *the* cause when
 * events never fire. That is true of consent. It is false of the capture: in
 * v12.0.1 `<smart-camera-web>` publishes with `this.dispatchEvent(...)` on
 * itself, and the `CustomEvent` carries no `bubbles`, so it never reaches
 * `window`.
 *
 * Following the documentation here produces a flow that hangs on their
 * "Submitting…" screen forever with nothing in the console — the capture
 * happened, the listener is on the wrong object, and no error is raised by
 * either side. It cost a release to find.
 *
 * So the target is read out of the installed package rather than taken from
 * the docs, and pinned here: if a version bump moves the capture onto `window`
 * (or makes it bubble), this fails and somebody looks, instead of the check
 * silently never completing.
 */
function packageSource(relative: string): string {
  return readFileSync(
    join(process.cwd(), "node_modules", "@smileid", "web-sdk", relative),
    "utf8",
  );
}

describe("consent events", () => {
  const consent = packageSource("lib/components/consent/src/Consent.tsx");

  it("still dispatch on window, as their setup page says", () => {
    expect(consent).toMatch(
      /window\.dispatchEvent\(\s*new CustomEvent\(\s*['"]smileid-consent\.granted['"]/,
    );
    expect(consent).toMatch(
      /window\.dispatchEvent\(\s*new CustomEvent\(\s*['"]smileid-consent\.denied['"]/,
    );
  });

  it("are the names we listen for", () => {
    expect(CONSENT_GRANTED).toBe("smileid-consent.granted");
    expect(CONSENT_DENIED).toBe("smileid-consent.denied");
  });
});

describe("the capture's publish event", () => {
  const wrapper = packageSource(
    "lib/components/smart-camera-web/src/SmartCameraWeb.js",
  );

  it("still dispatches on the element, not on window", () => {
    /*
     * The assertion this file exists for. `this`, not `window` — which is the
     * opposite of what the documentation says.
     */
    expect(wrapper).toMatch(
      /this\.dispatchEvent\(\s*new CustomEvent\(\s*['"]smart-camera-web\.publish['"]/,
    );
  });

  it("still does not bubble, so window could not see it anyway", () => {
    /*
     * A `CustomEvent` only reaches `window` when it bubbles. Their publish
     * call passes `{ detail }` and nothing else — no `bubbles: true` — so the
     * event stops at the element even in a light DOM.
     *
     * Matched narrowly on the publish call so an unrelated `bubbles` elsewhere
     * in the file cannot make this pass by accident.
     */
    const publish = wrapper.match(
      /new CustomEvent\(\s*['"]smart-camera-web\.publish['"][\s\S]{0,160}?\)/,
    );

    expect(publish).not.toBeNull();
    expect(publish?.[0]).not.toContain("bubbles");
  });

  it("are the names we listen for", () => {
    expect(CAPTURE_PUBLISHED).toBe("smart-camera-web.publish");
    expect(CAPTURE_CLOSED).toBe("smart-camera-web.close");
  });
});
