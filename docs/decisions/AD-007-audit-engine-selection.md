# AD-007 Audit Engine Selection

Status: accepted

## Problem

Audit treated LanguageTool differently from model-backed engines:

- LanguageTool had its own permanent source tab;
- opening Audit started LanguageTool automatically;
- the editorial chain waited for LanguageTool before running Gemini and opening
  Lead;
- Gemini and Qwen were selected through the agent cycle, while LanguageTool
  lived outside that selection model.

This mixed three separate concerns: selecting an engine, preloading remote
results, and deciding which result participates in the current workflow.

## Decision

Audit exposes LanguageTool, Gemini, and Qwen through one engine cycle. Engine
availability is derived from the Audit configuration, and only the currently
selected engine variant is shown in the engine control.

LanguageTool has two distinct states:

1. Background prefetch may send the existing request and retain its normalized
   result in the current Audit session.
2. Foreground activation happens only after an explicit user action selects or
   opens LanguageTool.

Background prefetch must not:

- add LanguageTool suggestions to the visible Audit result;
- mark LanguageTool as checked or selected;
- change the active engine;
- show loading/progress UI;
- close the Audit panel;
- block or determine completion of the editorial command chain;
- surface an error in the interactive Audit flow.

When the user activates LanguageTool, Audit consumes a compatible prefetched
result when available and otherwise performs the normal request. From that
point the existing filtering, rejected-suggestion view, actions, and telemetry
apply as foreground behavior.

## Editorial chain

The chain starts the LanguageTool prefetch but waits only for its foreground
model-backed Audit check. The current chain selects Gemini explicitly. Lead may
open as soon as that foreground check completes; LanguageTool success, failure,
or latency cannot change the chain result. Audit remains open when Gemini has no
suggestions so the prefetched LanguageTool result can still be activated later.

```text
Audit opens
    |-- LanguageTool prefetch ----------------------> session cache
    |
    `-- Gemini foreground check --> Audit result --> Lead

User selects LanguageTool
    `-- cached result or request --> Audit result
```

## Ownership

- `src/actions/audit.js` owns engine availability, selection, background
  prefetch, foreground activation, and Audit presentation state.
- `src/actions/chain.js` declares which Audit work is foreground and which is
  background for the chain.
- `src/core/llm.js` continues to own shared model/provider execution. It does
  not need to treat LanguageTool as an LLM provider.

## Consequences

- LanguageTool is no longer a permanent special tab in the Audit header.
- The shared Audit selector can later apply contextual availability conditions
  without duplicating UI modes.
- Background transport and user-visible activation remain explicitly separate.
- Prefetched results are session-local and keyed to the current source text.
- The current implementation keeps the existing LanguageTool request for data
  continuity while removing it from workflow control.

## Follow-up questions

- Which page, role, content, privacy, or network conditions should enable each
  engine?
- Should background LanguageTool prefetch remain enabled after enough real
  usage data has been collected?
- Should the engine selector move to a shared non-LLM choice contract when a
  second feature needs mixed deterministic and model-backed engines?
- Should background prefetch telemetry be retained separately from foreground
  prompt-evaluation observations?

## Rejected alternatives

- Keep LanguageTool as a permanent special mode: preserves duplicated selection
  behavior and keeps the chain coupled to it.
- Remove the LanguageTool request immediately: loses continuity before the new
  interaction model is observed in real work.
- Merge LanguageTool into the global LLM provider registry: it is not an LLM
  provider and would incorrectly appear in unrelated model-only selectors.

