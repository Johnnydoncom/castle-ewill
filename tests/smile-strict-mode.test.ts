import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The guided capture, pinned against the package that provides it.
 *
 * `use-strict-mode` switches `<smart-camera-web>` from a capture gated on a
 * smile — which tells the client nothing, and left people staring at their own
 * face waiting for something to happen — to Enhanced SmartSelfie™: randomised
 * head-turn prompts, one at a time, gated on following them.
 *
 * It is pinned here because **Smile ID's own documentation does not mention
 * it**. Their theming page lists only `theme-color` and `hide-attribution` for
 * this element, and their docs assistant answers that no such option exists.
 * The attribute is real — it is in the package's `observedAttributes` and in
 * the selfie component's README — but a fact that lives only in a dependency's
 * source is a fact that can disappear on a version bump, and the failure would
 * be silent: no error, no warning, just a capture that quietly stops asking.
 *
 * So this reads the installed package. If an upgrade removes the attribute,
 * this fails and somebody looks, rather than a client meeting the smile
 * capture again with no explanation.
 */
/*
 * Read from disk rather than resolved through `exports`, which deliberately
 * publishes only the entry points — the source these assertions are about is
 * not one of them.
 */
function packageSource(relative: string): string {
  return readFileSync(
    join(process.cwd(), "node_modules", "@smileid", "web-sdk", relative),
    "utf8",
  );
}

describe("Smile ID's guided liveness capture", () => {
  const wrapper = packageSource(
    "lib/components/smart-camera-web/src/SmartCameraWeb.js",
  );

  it("is still an attribute the wrapper watches", () => {
    /*
     * `observedAttributes` is what makes the element react to it at all. An
     * attribute the element does not observe is inert markup.
     */
    expect(wrapper).toContain("'use-strict-mode'");
  });

  it("is still passed down to the screens that run the capture", () => {
    /*
     * Watching it is not enough — the wrapper renders `<selfie-capture-screens>`
     * into its own shadow root, and the attribute has to travel with it. This
     * is the interpolation that carries it.
     */
    expect(wrapper).toMatch(/selfie-capture-screens[^>]*\$\{this\.useStrictMode\}/s);
    expect(wrapper).toContain('use-strict-mode="true"');
  });

  it("still treats the string 'false' as off", () => {
    /*
     * Which is why the component renders the attribute only when strict mode
     * is wanted, rather than always rendering it with a boolean-ish value: a
     * `false` here would read as on under a presence check, and as off under
     * this one.
     */
    expect(wrapper).toContain("!== 'false'");
  });

  it("still documents what strict mode does, in the package itself", () => {
    // Belt and braces: if their README stops describing the head-turn prompts,
    // the mechanic may have changed even though the attribute survived.
    const readme = packageSource("lib/components/selfie/README.md");

    expect(readme).toContain("use-strict-mode");
    expect(readme.toLowerCase()).toContain("head-turn");
  });
});
