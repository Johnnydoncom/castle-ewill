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

describe("the document capture, when nested", () => {
  const wrapper = packageSource(
    "lib/components/smart-camera-web/src/SmartCameraWeb.js",
  );

  /*
   * Their setup page shows `<document-capture-screens>` written as a child of
   * `<smart-camera-web>`, and their payloads page shows the two mounted side
   * by side with a listener each. The shipped wrapper does neither: it renders
   * its *own* document screens into its shadow root from its *own* attributes,
   * ignoring any child, and drives the sequence itself.
   *
   * Everything below is what makes a single `smart-camera-web.publish` carry
   * the document as well as the selfie. If a version bump changes it, this
   * fails — rather than a job going to Smile ID with no document in it.
   */
  it("renders its own document screens from its own attributes", () => {
    expect(wrapper).toMatch(
      /<document-capture-screens[^>]*\$\{this\.documentCaptureModes\}/s,
    );
    expect(wrapper).toContain("this.shadowRoot.querySelector(");
  });

  it("still gates the document step on the presence of capture-id", () => {
    // `hasAttribute`, not `getAttribute` — which is why the attribute is set
    // to an empty string rather than to "true".
    expect(wrapper).toMatch(
      /get captureId\(\)\s*\{\s*return this\.hasAttribute\(\s*['"]capture-id['"]\s*\)/,
    );
  });

  it("still merges the document frames into its own publish", () => {
    /*
     * The assertion the single-listener design rests on: on the document
     * publish it concatenates onto `_data.images` and immediately publishes.
     */
    expect(wrapper).toMatch(
      /document-capture-screens\.publish['"],\s*\(event\)\s*=>\s*\{\s*this\._data\.images\s*=\s*\[\s*\.\.\.this\._data\.images,\s*\.\.\.event\.detail\.images,?\s*\];\s*this\._publishSelectedImages\(\)/,
    );
  });

  it("still takes the selfie first, then the document", () => {
    // Their flow diagram shows document → selfie. The element does the
    // reverse, and the guidance copy is written to match the element.
    expect(wrapper).toMatch(
      /selfie-capture-screens\.publish[\s\S]{0,260}?if \(!this\.captureId\)[\s\S]{0,120}?this\.setActiveScreen\(this\.documentCapture\)/,
    );
  });
});

describe("the capture-id attribute, as React renders it", () => {
  /*
   * `capture-id` is presence-checked by the element (`hasAttribute`), not read
   * for a value. So the document step is switched on with an **empty string**
   * and off with `undefined` — which reads oddly enough that somebody could
   * reasonably try to "fix" it to a boolean or to `"false"`.
   *
   * Both of those would be wrong in the same direction: React renders the
   * string `"false"` as `capture-id="false"`, an attribute that is *present*,
   * so a recheck would be walked through photographing an ID for a job with no
   * field to carry it. This pins the two halves together — what React emits,
   * and what the element does with it.
   */
  const render = async (value: string | undefined) => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { createElement } = await import("react");

    return renderToStaticMarkup(
      createElement("smart-camera-web", { "capture-id": value }),
    );
  };

  it("emits the attribute for an empty string, which is what turns it on", async () => {
    expect(await render("")).toContain("capture-id=\"\"");
  });

  it("omits it entirely for undefined, which is what a recheck sends", async () => {
    expect(await render(undefined)).not.toContain("capture-id");
  });

  it("would emit a present attribute for \"false\" — which is why we never send one", async () => {
    // Not how we call it; asserted so the footgun is documented rather than
    // discovered. `hasAttribute` would read this as "yes, capture a document".
    expect(await render("false")).toContain("capture-id=\"false\"");
  });
});
