# Editing activity telemetry

`<section>-<postId>-activity.json` is an additive member of the existing per-post telemetry ZIP. Readers must continue to accept packages where this optional member is absent.

## Schema

The root schema is `onliner.activity/v1`:

- `source`: `post_id`, `section`, and the existing session identifier `active`;
- `coverage`: enabled capture hooks, the 1500 ms manual-edit grouping window, persistence state, and explicit limitations;
- `overflow`: event and serialized-size limits, truncation state, dropped-event count, and reasons;
- `events`: ordered compact activity events;
- `exported_at`: UTC ISO 8601 time when the JSON member was prepared.

Command events contain `command_id`, `status`, UTC start/completion times, monotonic elapsed duration in milliseconds, and the telemetry stage visible at start/completion. `completed` means only that the command invocation returned or resolved; it is not a claim that text changed. Rejections and thrown errors are recorded as `failed` without error text or parameters.

Manual events contain the editor source, normalized operation, browser `inputType`, UTC grouping boundaries, operation count, telemetry stage, and coarse character deltas when length comparison is meaningful. Consecutive trusted `insert` or `delete` events with the same source and `inputType` are grouped when no more than 1500 ms apart. The grouping span is not reported as active editing time.

Audit events contain only `audit_event_id`, `run_id`, `decision_id`, and the coarse action. Detailed suggestion text, decisions, providers, and outcomes remain in `audit.json`.

```json
{
  "id": "manual-example",
  "type": "manual",
  "source": "wordpress-textarea",
  "operation": "insert",
  "input_type": "insertText",
  "started_at": "2026-10-25T10:00:00.000Z",
  "completed_at": "2026-10-25T10:00:00.700Z",
  "operations": 4,
  "stage": "1GL",
  "effect": { "net_characters": 4, "added_characters": 4 }
}
```

## Coverage and privacy

Manual attribution uses only trusted native `beforeinput`/`input` events from `#content`, the TinyMCE content document, and the core WordPress title, excerpt, slug, and SEO-title fields. Synthetic input emitted by Toolbar and Audit code is excluded. Trusted input arriving while a centrally dispatched Toolbar command is still running is conservatively omitted because its attribution is ambiguous; this prevents the same operation from being counted as both Toolbar and manual work. No key values, text, clipboard data, selections, HTML, URLs, pointer streams, user identifiers, or inferred reading time are recorded.

The recorder does not observe arbitrary DOM mutations. Browser/editor changes that produce no trusted input event remain unobserved, and unsupported input types are recorded as `unknown`. Missing editors and unavailable or malformed session storage do not block snapshot capture or ZIP export; coverage and persistence fields describe the limitation.

Activity uses the same post-scoped `active` sessionStorage scope and 24-hour TTL as the snapshots. The first real event is the observable session start: normally the first Toolbar command, or a retained manual edit if the editor was changed before any command. Merely opening the page creates no event and implies no active time. `0HF` capture does not reset activity, so the first Cleanup, repeated Cleanup runs, intervening manual edits, and Audit references remain ordered in one record. Events are capped at 500 and 131072 serialized characters; oldest events are removed with explicit overflow metadata.

Reloading the same post in the same tab retains its unexpired activity. Different posts use different storage keys. Separate tabs have browser-defined sessionStorage isolation and no cross-tab synchronization; a tab cloned from an opener can begin with a copied store, after which the stores diverge. Expired or malformed records start empty. These boundaries do not infer active time and do not add synthetic session events.

Audit details retain their existing lifecycle: Cleanup may reset `audit.json`. Activity keeps the earlier coarse Audit references as historical events, so references from before a later Cleanup can outlive their detailed Audit records.
