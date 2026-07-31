/**
 * Vitest resolves the `server-only` package to its client entry point, which
 * throws on import. Unit tests exercise server modules directly in Node, so the
 * guard is stubbed out here. The real guard still applies in the Next.js build.
 */
export {};
