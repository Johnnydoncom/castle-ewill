"use client";

import { useState } from "react";

/**
 * Keeps an input's value across the reset React performs after a form action.
 *
 * React resets a `<form action={fn}>`'s fields once the action's promise
 * settles — it has no notion of an application-level validation error, only a
 * resolved action. An **uncontrolled** input cannot survive that: changing
 * `defaultValue` on an already-mounted input does not change what the user
 * sees, so echoing the submitted values back had no effect and the form went
 * blank on every validation error.
 *
 * Making the input controlled is what actually fixes it. React owns the
 * value, so the render that follows the reset puts it straight back.
 *
 * `seed` is re-applied whenever it *changes* — the classic "adjust state when
 * a prop changes" case, done during render rather than in an effect exactly
 * as the React docs prescribe. An effect would paint the empty field first
 * and then correct it, which is the flicker this is meant to avoid.
 *
 * @see https://react.dev/reference/react/useState#storing-information-from-previous-renders
 * @see https://react.dev/reference/react-dom/components/form
 */
export function useFieldValue(
  seed: string | undefined,
): [string, (next: string) => void] {
  const [value, setValue] = useState(seed ?? "");
  const [lastSeed, setLastSeed] = useState(seed);

  /*
   * Only when the seed itself moves. Comparing against the *value* instead
   * would fight the user: every keystroke differs from the seed, so the
   * field would snap back to the last submission as it was typed in.
   */
  if (seed !== lastSeed) {
    setLastSeed(seed);
    setValue(seed ?? "");
  }

  return [value, setValue];
}
