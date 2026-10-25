# Three HT Template Defaults

## Source Manifest

- Figma file `NyOe8m6Kr6Pr8f0tk2oBqN`, read-only session `afb63aa9-8fa9-4f64-8d37-434818793f2b`. No Figma nodes changed.
- Membership specification `1201:20898`, actual scene `1231:32353`, ActionSheet `1231:32435`: gray underlay, 129px top offset, 260px artwork, editable title/caption, carousel indicators, package heading, three card slots, countdown, 55px purchase action and safe area.
- Recovery specification `1202:20898`, actual preview `1202:20905` / `1231:32949`: 375px source scaled to 390px, dimmed Messages backdrop, separate white sheet, dismiss control, title, multilingual illustration, caption, compact package rows, countdown and checkout.
- SKU specification `1203:20898`, actual sheet `1276:34236`: 289px top offset, separate title/subtitle and close header, 358x156 illustration slot, countdown, bound package information, purchase action and safe area.
- Existing immutable Figma assets retained. Added only the exported decorative background `1231:32437` as `member-decoration.png`; phone artwork uses its own 220px design slot. No whole-page reference image is used as the rendered UI.
- Original `Figma四模板组件映射.md` recorded these three page reconstructions as incomplete. Earlier calibration changed geometry but did not fix ownership. Current runtime source is the canonical component document, not the old HT CSS renderer.

| ID | Priority | Evidence | Change | Local Verification |
| --- | --- | --- | --- | --- |
| HTD-01 | P1 | Membership carousel and purchasing blocks were siblings on a gray Screen; no encompassing scene composition, close control, package header or annual monthly-price binding. | One editable scene with separate hero/copy and package/purchase groups. Restore original artwork layering, compact type and card slots; monthly prices resolve from the actual SKU. | Fresh IAB render, loaded-media readback, native edits and save/reopen retain group, monthly price and PurchaseButton. |
| HTD-02 | P1 | Recovery backdrop was not dimmed; price/badge layout expanded in the wrong column; no native dismiss control. | Separate source Image with configurable scrim and white content group, close Button, fixed art slot, monthly package display and compact price/badge owners. | Fresh IAB render, both images loaded, monthly prices visible, original SKU data unchanged, save/reopen passed. |
| HTD-03 | P1 | SKU displayed the old promotional headline and caption as body blocks rather than a distinct native header; reference prices were not mapped to the actual SKU fields. | Header owns title/subtitle/close; body owns 358x156 media, Countdown, Packages, real reference-price text bindings and PurchaseButton. | Fresh IAB render, native close dispatch test, preview closes, save/reopen passed. |

## Configuration Boundaries

- Root Screen remains one workflow scene; its visible sheet is an ordinary editable Stack composition, not a hidden button-launched duplicate overlay. This preserves canvas step creation and copying a scene into a multi-step flow.
- Existing product records, copy, SKU IDs, prices, badges, legal text and links remain configuration-owned. Figma placeholder prices, promotional discounts, English CTA examples and placeholder titles do not overwrite those business values. Retained legal text can extend the scrollable document beyond the design frame.
- Membership has one configured real Slide. Its indicator count matches real Slides, not the six decorative example dots in the source. Additional Slides remain supported; no fake destinations were inserted.
- Existing user drafts are not structurally migrated. Reapplying the template creates the corrected defaults; editing or opening a saved draft does not silently replace its structure.
- Blue Privilege, all 41 RevenueCat gallery definitions, real payment execution and external document/Figma writing are outside this batch.

## Verification

- 302/302 tests passed, including three new mounted checkout/edit/dismiss tests and seven structure/SKU/persistence tests. Final Vite build passed in 2.89 seconds; whitespace check passed.
- Actual local builder applied, saved and reopened each of the three templates. Root groups and checkout type survive. Actual SKU preview close action renders the closed state.
- Final fresh captures: `/tmp/ht-membership-plans-final.png`, `/tmp/ht-payment-recovery-final.png`, `/tmp/ht-sku-sheet-final.png`. Native viewport is 830px; scroll totals 849, 833 and 875px. All referenced images loaded successfully.
- Full parameter reference regenerated: 32 component types, 3367 rows. New bindings explicitly distinguish SKU monthly price and SKU reference total.
- Production verification is recorded in the delivery receipt after release.

Production closure: source `2182b69` pushed; original domain serves `index-cB2aqB1g.js`. Actual IAB applied each of the three templates and read the new groups, SKU monthly/reference values, native checkout/close controls and loaded assets. SKU preview close rendered the closed state, then returned to the editor. No production test content saved. All three issues are 已修改; receipt `ht-template-scene-delivery-2026-10-25.json` records exact boundaries and screenshots.
