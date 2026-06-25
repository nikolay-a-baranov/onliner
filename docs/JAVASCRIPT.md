# JavaScript Code Rules (Project Standard)

## Purpose

This document defines strict rules for writing JavaScript code in this project.

These rules MUST be followed in:

- all source files
- scripts
- automation
- integrations
- ChatGPT-assisted code

---

## Core Principles

1. Code must be **deterministic**
2. Code must be **predictable**
3. Prefer **simple pipelines over complex logic**
4. Avoid abstraction unless necessary
5. No hidden behavior

---

## Function Design

Functions must be:

- small
- pure (where possible)
- single-responsibility

Preferred pattern:

```js
(value) => value;
```

---

## Pipeline Pattern (Preferred)

When processing data, always use pipelines:

```js
const pipe = (value, fns) => fns.reduce((s, fn) => fn(s), value);
```

Example:

```js
run(value) {
  return pipe(value, [
    step1,
    step2,
    step3,
  ]);
}
```

Rules:

- No nested logic when pipeline is possible
- Each step must be independent

---

## Block Structure

All logical blocks must follow this structure:

```js
block(value) {
  const step = (value) => ...
  return [
    step,
  ].reduce((s, fn) => fn(s), value);
}
```

---

## Extended Block Structure

```js
block(value) {
  const step1 = (value) => ...
  const step2 = (value) => ...
  return [
    step1,
    step2,
  ].reduce((s, fn) => fn(s), value);
}
```

---

## Nested Modules Pattern

For grouped logic:

```js
block(value) {
  const module = {
    step(value) { ... },
    run(value) {
      return [
        module.step,
      ].reduce((s, fn) => fn(s), value);
    },
  };
  return [
    module.run,
  ].reduce((s, fn) => fn(s), value);
}
```

Rules:

- Always include `run`
- Keep scope local
- Do not export internal steps

---

## Naming Conventions

### Objects

- One English noun
- Must reflect responsibility

Examples:

- `text`
- `editorial`
- `build`
- `parser`

---

### Methods

- Verb-based
- Must describe action
- Same action should have the same name across modules (`run`, `get`, `set`, `sync`)
- Avoid global name conflicts by grouping methods inside local objects/modules

Examples:

- `run`
- `build`
- `parse`
- `normalize`
- `replace`

---

### Variables

- Meaningful names
- No ambiguous abbreviations
- Compound names are allowed when they increase clarity (`currentState`, `prevTimestamp`, `widgetMode`)

Examples:

- `value`
- `string`
- `file`
- `data`

---

## Code Style

- No empty lines unless necessary
- No inline comments inside logic
- No decorative formatting
- Minimal vertical spacing

Bad:

```js
const a = 1;

// fix value
const b = 2;
```

Good:

```js
const a = 1;
const b = 2;
```

---

## Immutability

Avoid mutation.

Bad:

```js
value = transform(value);
return value;
```

Good:

```js
return transform(value);
```

---

## Idempotency

Functions must be safe for repeated execution where applicable:

```js
fn(fn(value)) === fn(value);
```

---

## Conditional Logic

- Avoid deeply nested `if`
- Prefer early returns
- Prefer small functions

Bad:

```js
if (a) {
  if (b) {
    if (c) {
      ...
    }
  }
}
```

Good:

```js
if (!a || !b || !c) return value;
```

---

## DOM and Side Effects

- Keep pure transformations separate from DOM effects
- Run DOM writes/events only when value actually changed
- Keep side effects at integration points (click/input/change/focus/scroll)
- Always use guard checks before working with DOM elements that may be absent

---

## Module Scope

- Prefer local modules/objects inside IIFE blocks for grouped logic
- Do not leak temporary state to global scope unless intentionally required
- If temporary global state is required, use a single explicit key and clear restore flow

---

## State Flow

- For reversible actions, use explicit snapshot/restore pattern
- State shape should be explicit and stable (fixed keys)
- Update mode/state in one dedicated place (`mode.set`, `mode.sync`)

---

## Event Emission

- Emit events only after confirmed change
- Keep event emission centralized in one helper
- Prefer explicit event list (`input`, `change`) over scattered dispatches

---

## Encoding and Characters

- All project text files must be saved as UTF-8
- Source files that may contain Cyrillic must stay UTF-8 end-to-end (editor, git, build tools)
- In symbol sets, regex, and replacement tables, prefer explicit code forms for fragile typographic chars when stability matters:
- Use `\u00A0` for non-breaking space
- Use entity/code forms for quote/dash variants in pattern tables when needed to avoid mojibake
- If a character is easy to break across environments, store it as code in rules and decode/render at usage points

---

## Regex Usage

- Always be explicit
- Avoid broad patterns
- Scope matches tightly

---

## Order of Processing

When applicable, always process from:

1. low-level transformations
2. formatting
3. structural changes
4. semantic changes

---

## Extensibility

- Extend existing structures
- Do not create new layers without need
- Prefer composition over inheritance

---

## Reusability

- Extract helpers only if reused
- Do not over-generalize

---

## ChatGPT Usage Rules

When generating code:

- Follow this document strictly
- Do not introduce new patterns
- Do not add comments inside logic
- Do not change naming conventions

---

## Project Integration

1. Keep this file as `JAVASCRIPT.md` in project root
2. Reference in:
   - README.md
   - CONTRIBUTING.md

Example:

```md
All JavaScript code must follow JAVASCRIPT.md
```

3. For ChatGPT:
   - Add to system prompt OR
   - Reference explicitly in tasks

---

## Final Rule

If code does not follow these rules - it must be rewritten.
