# Headless UI Adaptation Matrix

## Goal

Build and evolve UI by separating:

- `UX` (state, keyboard, focus, events, accessibility contracts)
- `UI` (render markup + design tokens + CSS primitives)

This file maps external component patterns (shadcn/radix-like) to local primitives and rollout steps.

## Compatibility Decision

- Do not import `shadcn/ui` runtime directly.
- Reuse architecture/contracts and implement local headless primitives in vanilla JS.
- Keep bookmarklet-friendly footprint (no framework/runtime dependency overhead).

## Component Mapping

1. Dialog/Modal
- External pattern: `Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter`
- Local primitive:
  - UX: `ui.popup.headless.{lifecycle,keyboard,outside,theme,action}`
  - UI: `ui.popup` template + `css.ui.popup()` + `design.surface.popup.*`
- Status: `in progress` (core headless contracts already extracted)

2. Tabs
- External pattern: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- Local primitive:
  - UX: active tab state + keyboard navigation + aria selection
  - UI: toolbar segment groups (`toolbar.group`, `toolbar.strip`, `toolbar.button`)
- Current usage:
  - proofread source tabs are custom and should migrate to shared tab primitive

3. Segmented Controls
- External pattern: segmented toggles / switch groups
- Local primitive:
  - UX: active option + disabled + hold/click behavior
  - UI: `toolbar-segment-group`, `toolbar-segment`, `toolbar-unified-button`
- Current usage:
  - launcher/editor already close to primitive composition

4. Item/List
- External pattern: `Item`, `ItemContent`, `ItemActions`
- Local primitive:
  - UX: selection/active row, action dispatch, list virtualization/fit
  - UI: panel list shell + row slots
- Current usage:
  - proofread list has custom row markup and should migrate to slot-like row primitive

5. Progress
- External pattern: progress bar with semantic states
- Local primitive:
  - UX: set/reset/progress lifecycle
  - UI: `.progress`, `.progress-track`, `.progress-fill` + `design.surface.progress.*`
- Status: done for filter, reusable for other flows

## Target Local Primitive Set

1. `ux.dialog`
- open/close
- lifecycle cleanup
- outside click suppression
- keyboard contract
- theme contract

2. `ux.tabs`
- register tabs
- set active tab
- next/prev keyboard navigation
- disabled handling

3. `ux.list`
- active row
- next row resolution
- action routing

4. `ui.panel`
- shell/layout/frame

5. `ui.controls`
- button/group/segment/tab trigger/progress

## Proofread Rollout (Priority)

1. Extract proofread source tabs to shared `ux.tabs` + shared tab UI primitive.
2. Replace proofread status/progress custom wiring with reusable progress lifecycle.
3. Move proofread header actions to unified action map contract (same style as popup headless action).
4. Keep proofread-specific tokens in `design.surface.proofread.*`; avoid behavior logic in CSS.

## Execution Rules

1. Prefer adapting reusable primitives over creating one-off panel logic.
2. Add new token only when an existing primitive token cannot express the requirement.
3. Keep each migration step behavior-preserving and build-gated (`node tools/build.js`).
4. If a local override appears in two surfaces, promote it to primitive.
