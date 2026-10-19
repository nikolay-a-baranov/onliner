# AD-003: Build module registry

## Status

Accepted and used by default since 2026-10-19.

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

The registry implementation is the default for normal, watch, and legacy
builds. The compatibility inline bundler remains available through `--inline`
as a temporary diagnostic and emergency fallback.

## Analysis contract

`node tools/build.js --analyze` builds the default registry variant in memory,
checks JavaScript syntax, and reports:

- generated bundle size;
- total size of unique source modules;
- emitted module count versus unique module count;
- dependency expansion count of the compatibility model.

Registry analysis is blocking when emitted and unique module counts differ.
The normal registry build also blocks when a budgeted shared-graph entry
exceeds its bundle-size limit. `node tools/build.js --inline --analyze` remains
available for comparison with the former recursive expansion model.
Analysis mode must not write `dist/`, manifests, loaders, or storefront HTML.

## Default cutover verification

Before the default changed, both analysis modes produced the same active entry
list, all generated scripts passed syntax checks, and normal plus legacy builds
completed. Launchpad was smoke-tested in a headless browser and on a real CMS
test record, including panel expansion and icon loading/fallback behavior.

The verified registry baseline reduced `launchpad.js` from about 44 MiB and
509 expanded module copies to about 2.5 MiB and 65 single-emission modules.
Size budgets for the large shared-graph entries include deliberate headroom
above this baseline and are enforced only for registry builds.

## Consequences

Shared modules now have singleton semantics within one entry bundle, matching
normal ES module execution. Code that accidentally relied on a dependency
being re-created for every import must be corrected explicitly rather than
preserved in the bundler.

The module transformer intentionally supports only the import/export forms
already used by the repository. New module syntax must be added deliberately
with a build fixture or smoke check. `npm run test:build-registry` verifies
single module execution, aliased imports, source-order side effects, and the
single-emission count against a small executable fixture graph.
