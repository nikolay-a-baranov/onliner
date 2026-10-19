# AD-003: Build module registry

## Status

Trial implementation behind `--registry`.

## Context

`tools/build.js` produces self-contained browser scripts without an external
runtime dependency. The original bundler replaces every named import with a
new inline IIFE containing the complete dependency subtree.

That behavior is deterministic, but a shared module is emitted and evaluated
again for every import path. Diamond-shaped dependency graphs therefore turn a
small source tree into very large generated files. In the October 2026 local
baseline, `launchpad.js` contained 509 emitted module copies for 65 unique
source modules and occupied about 44 MiB.

## Decision

Keep generated scripts self-contained, but represent their source graph as a
bundle-local module registry:

- each source module is emitted once per entry bundle;
- imports resolve through a bundle-local `require` function;
- module exports are cached before execution;
- named imports and side-effect imports keep their source order;
- circular imports remain rejected by the build;
- no registry state is shared between separate entry bundles;
- source modules continue to use the existing named ES module syntax.

The registry implementation remains behind `--registry` until browser smoke
tests cover the active entry surfaces. The compatibility inline bundler stays
available during the trial.

## Analysis contract

`node tools/build.js --analyze` reports the compatibility inline baseline.

`node tools/build.js --registry --analyze` builds the registry variant in
memory, checks JavaScript syntax, and reports:

- generated bundle size;
- total size of unique source modules;
- emitted module count versus unique module count;
- dependency expansion count of the compatibility model.

Registry analysis is blocking when emitted and unique module counts differ.
Analysis mode must not write `dist/`, manifests, loaders, or storefront HTML.

## Verification before default cutover

1. Run both analysis modes and compare their entry lists.
2. Run `node tools/build.js --registry` and syntax-check every generated script.
3. Smoke-test Launchpad, Reader, Editor, Author, Report, and standalone tools.
4. Run the normal project build and review the complete generated diff.
5. Make registry mode the default only after the active surfaces pass.
6. Add bundle-size budgets from the verified registry baseline, not from the
   oversized inline baseline.

## Consequences

Shared modules now have singleton semantics within one entry bundle, matching
normal ES module execution. Code that accidentally relied on a dependency
being re-created for every import must be corrected explicitly rather than
preserved in the bundler.

The module transformer intentionally supports only the import/export forms
already used by the repository. New module syntax must be added deliberately
with a build fixture or smoke check.
