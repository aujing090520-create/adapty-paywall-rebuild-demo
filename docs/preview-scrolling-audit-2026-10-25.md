# Preview Scrolling Repair

Scope: native scrolling in peer artboards, scaled selection reveal, and modal isolation. Template copy, media, SKU data, geometry and workflow configuration are unchanged.

| ID | Priority | Reproduced evidence | Change | Verification | Status |
| --- | --- | --- | --- | --- | --- |
| SC-01 | P1 | At 75%, phone scrollTop reached 28.5; subsequent wheel events could not move the outer page (scrollY remained 744.5). | Allow native vertical scroll chaining in editing artboards and their canvas; retain horizontal containment. | Local IAB: phone 0 -> 28.5 -> 0; at its boundary the next wheel moves outer page 0 -> 720, and back to 0. Also replayed at 50% and 100%. | Locally verified |
| SC-02 | P1 | With the whole screen selected, changing padding from 0 to 1 pulled scrollTop from 28.5 to 2. | Key navigation effects by semantic values, not newly allocated objects; do not auto-focus whole screens or interactive preview; convert transformed rect deltas to layout scroll units. | Local IAB: padding 0 -> 1 -> 0 retains scrollTop 28.5. Mounted tests cover equivalent reordered navigation, property rerenders, whole-screen selection, interactive preview, and upward/downward reveal at 30/50/75/100/150%. | Locally verified |
| SC-03 | P1 | Modal must remain independently scrollable without moving its background. | Contain scroll at floating modal boundaries; allow vertical touch panning. | Local IAB: temporary popup padding 350 produces clientHeight 721 and scrollHeight 1042; actual wheel moves popup 0 -> 321.02 -> 0 while both background scrollTops remain 0 and page scrollY remains 523.5. Padding restored to 24 afterward. | Locally verified |

Automated verification: 282/282 tests passed; production build passed; diff whitespace check passed. New focused test file: `tests/previewScrolling.test.js` (6 tests).

Local render: `/tmp/paywall-scroll-local.png`. All temporary parameter changes were isolated in an agent-owned browser origin and restored, never saved to the user's paywalls.

Production acceptance: original domain serves the final `index-BHmnB_qu.js` / `index-DWwyJYo5.css`; the actual 75% Blue Privilege board reports the new `overscroll-behavior:auto` and expected clientHeight 830 / scrollHeight 858. Native down/down/up inputs were followed by a recovered readback showing outer scrollY 0 -> 720 and phone scrollTop back at 0. Screenshot: `/tmp/paywall-scroll-production.png`. The combined action/readback call exceeded its limit, so intermediate production scrollTop values were not retained; detailed down/up values, modal isolation and configuration-rerender checks are from local IAB, not claimed as repeated in production. All SC-01/02/03 changes are verified and closed.

Vercel CLI deployment-list metadata was unavailable after two network failures; direct HTTP asset identity and production browser render/scroll readback were used for release verification. No duplicate manual deployment, browser switch or permission change was performed.
