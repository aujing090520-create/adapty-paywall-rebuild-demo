# Button-owned modal delivery

## Scope and authorization

Target: existing paywall builder. Outcome: legible package hierarchy and button-owned modal configuration. Allowed surfaces: component tree, button actions, modal artboards, legacy migration, affected preview and tests. SKU values, template media and existing saved source records are unchanged evidence. No PRD/Figma writeback or network settings changes.

Source: user recording `20261026191715_rec_.mp4` and the two accompanying screenshots. The explicit button-owned model supersedes the earlier page-close trigger model. Existing GitHub remote and Vercel production host are the authorized normal release destinations.

## Issue Ledger

1. Package hierarchy selection range is unclear. Add continuous selected-descendant tint, independent hover, fixed drag grip and stable row geometry. Preserve component-oriented Chinese names and valid Package/Stack boundaries.
2. Modal ownership and trigger are split across page settings and standalone layers. Move configuration to Button action, nest modal under its trigger, display only connected modal artboards, support editable close/back Icon buttons, and migrate legacy bindings without dropping content or SKU data.

## Checks

Pure migration/idempotence/ownership tests; editor creation, binding, action switching, deletion and undo; hierarchy selection; preview open/return; save/reopen; build; source push; production deployment and affected-path readback. This change does not claim RevenueCat billing or SDK parity.

## Local Verification

- Issue 1 implemented: 16px indentation steps, fixed drag gutter, selected-subtree tint and independent hover. Row height remains 34px for existing controls.
- Issue 2 implemented: direct Button action, editable close/back icon presets, nested modal container, active-binding-only boards and edges. Unbinding or changing the action retains inactive content; deleting a modal clears references and is undoable.
- Legacy migration preserves original component IDs and SKU records; independent saved content is copied without editing its source. Shared legacy targets receive independent owned copies. Multi-screen and cross-sheet destinations remain linked after copy. Migration never rewrites a Back button into Close.
- Popup commerce/required controls are scoped to that popup. Normal page commerce remains final-step-only. Nested Back restores its parent modal. Shared-header bindings and disabled countdown fallback branches are covered.
- Final automated run: 375 passed, 0 failed, 0 skipped. Build: 3.19 seconds; JS `index-B7IO8pcq.js`, CSS `index-DI6SYTzd.css`.
- Local browser: Blue template; add Close; choose OpenSheet; bind existing; actual icon opens modal; return; switch to Dismiss removes board/edge; switch back restores content; save, refresh and reopen retains binding and three original SKUs; unbind and create a useful native retention modal succeeds. Test record saved only on the isolated local test origin.
- Production verification is a separate release check, not implied by these local results.
