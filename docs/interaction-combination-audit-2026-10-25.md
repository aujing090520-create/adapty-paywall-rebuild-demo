# Screen, Action And Exit Offer Acceptance

## Boundary

RevenueCat official documentation limits multi-step exit offers to dismissal from the final screen. The user explicitly chose a Demo extension: each visible workflow Screen can bind its own close-triggered offer. This is labeled in the UI, not represented as RevenueCat parity.

Sources: [Creating Paywalls](https://www.revenuecat.com/docs/tools/paywalls/creating-paywalls), [Components](https://www.revenuecat.com/docs/tools/paywalls/creating-paywalls/components).

| Issue | Priority | Evidence | Decision / Outcome | Verification |
|---|---|---|---|---|
| IC-01 | P1 | One global exit binding, one saved exit draft, close port only on final Screen | Add `settings.exitOffersByScreen[screenId]`; each real Screen owns a close port and independent binding; batch-save all bound drafts | Model, mounted Editor, actual App storage tests; isolated IAB three Screens, two created offers, runtime and save/reopen |
| IC-02 | P1 | Creation selector accepted only preconfigured NextScreen Buttons; resolver accepted self/hidden/auxiliary/wrong-flow targets | Explicitly chosen ordinary or purchase CTA can become NextScreen without changing source/style; validate actual destinations, retain invalid IDs for repair | Creation and target matrix tests; existing checkout conversion/preview regressions |
| IC-03 | P2 | Canvas lacked hover feedback | One shared click/hover hit policy; only active artboard highlights; no document persistence | Mounted pointer/leave/scroll/inactive/preview tests; actual IAB active and inactive pointer readback |
| IC-04 | P2 | Renaming offer root left its Offering name stale | Synchronize saved Offering name with its presentation root; generic new offers get source-specific default names | Actual App save/discard/reopen test; IAB renamed both offers and read independent names from settings |

## Combination Matrix

| Source / Action | Target / Preconditions | Result And Edge | Ownership / Persistence |
|---|---|---|---|
| Any visible real workflow Screen / close | Bound independent Offering with products | Enter that Screen's offer; green dashed close edge | Per-Screen stable-ID map; Demo extension |
| Same / unbound, disabled, missing, inactive, self or productless offer | No usable target | End session, not a blank Screen; unusable binding remains repairable | Explicit empty map entry disables legacy fallback |
| Legacy `exitOfferOfferingId` only | Final visible non-auxiliary Screen | Old final-only behavior retained | Existing saved documents not rewritten |
| Offer / close or dismiss | Already inside offer | End entire session; no chained retention loop | Restart creates a fresh preview session |
| Button / NextScreen | Another visible real Screen in same Flow | Navigate to configured Screen, emit action-owned edge, push actual history | Action stores `actionPage`, not board order |
| Button / NextScreen | Missing, self, hidden, auxiliary, wrong type or other Flow | Reject navigation; repairable target warning | No silent fallback to a different destination |
| New Screen / chosen ordinary or purchase CTA | Explicit creation selector choice | Copied CTA becomes NextScreen to following Screen | Source untouched; IDs, visual properties and child copy retained in new copy |
| New Screen / no explicit CTA choice | Only one already-NextScreen CTA can auto-select | Otherwise unconnected until configured | Never auto-convert an arbitrary purchase CTA |
| Button / NavigateBack | Open Sheet, or actual Flow history | Close ordinary Sheet, or return to visited Screen; no exit offer | History is runtime-only; initial-screen Back falls back to dismissal |
| Button / OpenPage | Valid different Screen in same Flow | Detail navigation; no funnel edge | Existing detail links retained, generated unconfigured detail remains gated |
| Button / OpenSheet, CloseSheet | Visible BottomSheet / current overlay | Open/close ordinary overlay; no automatic exit binding | Sheet remains a component, not a workflow Screen |
| Button / link, privacy, terms | Valid URL and configured opening method | In-app / external / deep link; no Screen edge | Existing URL validation and parameter ownership retained |
| PurchaseButton or explicitly converted Button / checkout | Final Screen, visible required agreement satisfied | Mock checkout only; no fake payment success | Final-step commerce gate unchanged by exit extension |
| Screen / copy, reorder, delete | 1-10 real Screens | Stable source bindings survive reorder/rename; copied Screen gets no inherited retention; deleted source cannot trigger | Stale source map ignored; removed destination remains repairable |
| Two Screens / same saved offer | Shared content intentionally selected | Two close edges, one content artboard; source context chooses correct backdrop | Shared document edits are intentionally shared, bindings are independent |
| Multiple bound offer drafts / save, discard, reopen | Valid document batch and available storage | Save all bound drafts atomically; rollback on failure; discard restores saved records | Actual App save integration covers three bound offers |
| Active artboard / hover then click | Editable visible component | Thin hover border matches next click target; button label first selects Button, subsequent drill-in can select Text | Ephemeral hover state only |
| Inactive artboard, preview, inert backdrop | Pointer / scroll / selection change | No hover; stale outline clears on leave, scroll, selection and preview change | Does not mutate document, layer selection or navigation |

## Component Ownership Coverage

This is a source-backed interaction ownership check, not a claim that every arbitrary nesting and external SDK integration was manually accepted.

| Component Types | Interaction Owner / Constraints |
|---|---|
| Screen, Flow | Initial Screen, real steps, action targets and per-screen exit binding; auxiliary details not real steps |
| Button, PurchaseButton | Common action selector; conditional checkout modes; explicit action change can convert component purpose while retaining appearance |
| BottomSheet | Ordinary component-triggered overlay; becomes an independent exit Offering only through explicit promotion |
| Package | SKU/group/default selection and selected visual state, not arbitrary Screen navigation |
| ExpressCheckout, CheckoutState, Wallet | Availability state / wallet checkout preview; not a second independent step router |
| Tabs, Tab, TabControl, TabButton | Owning Tabs and target index; not Flow Screen targets |
| Carousel, Slide, PageControl, Indicators | Owning carousel's slide, autoplay, looping and pagination; slides may contain images or other allowed components |
| Switch, SwitchCase, Toggle | Owning boolean / branch / required agreement state; not an exit trigger |
| Countdown, CountdownState | Time source and active/ended/fallback content; not automatic Screen navigation |
| Timeline, TimelineItem | Layout and connector ownership; actions belong to nested Button when present |
| Stack, Header, Footer | Layout/placement; actions belong to nested controls, not the container itself |
| Text, Image, Video, Icon | Content/media/style; text links use text-link rules; canvas hover selects editable target, not a fabricated action field |
| Custom | ZIP sandbox and read-only context bridge; native commerce/navigation not delegated to arbitrary embedded code |

Detailed parameter reference regenerated: 32 component types, 3369 field/option rows. Runtime checks remain scoped to the changes and automated regression suite; real purchases, external SDK behavior and every Cartesian nesting combination are not certified.

## Local Evidence

- 310 automated tests passed, including actual App multi-offer persistence and rollback regressions.
- Isolated IAB origin: `http://interaction-audit-20261025.localhost:3017/`.
- Applied actual Multi-step Paywall; created SKU offer from first Screen and payment-recovery offer from second Screen using each canvas close port.
- Save/reload/reopen retained three main Screens, two offer artboards and two independent close edges.
- First Screen close rendered SKU offer; restart, Continue, second Screen close rendered payment-recovery offer; closing offer ended session.
- Active Screen title pointer readback: `.nc-hovered` on exact title ID with a computed outline; pointer over inactive third Screen: hover count zero.
- Screenshots: `/tmp/paywall-per-screen-config.png`, `/tmp/paywall-selected-board-hover.png`.

Production acceptance is recorded separately in the delivery receipt after deployment.
