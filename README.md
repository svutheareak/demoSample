# Academic Portal

A student portal front-end implementing the structure from the *Academic Portal
Mind Map* site map, in a blue/white theme: a full-width blue header bar, white
cards on a cool grey plane, soft radii and hairline borders.

Open `index.html` in any browser — no build step, no server, no dependencies.

Built to **WCAG 2.2 Level AA** — see [Accessibility](#accessibility) for what that
covers, the measured ratios, and the two gaps that remain.

## Structure

```
index.html                    app shell (sidebar, topbar, view container, live region)
assets/css/app.css            Modernist tokens + layout + components
assets/js/data.js             all records — and every derivation from them
assets/js/charts.js           SVG charts (line, bars, columns, sparkline, meter)
assets/js/ui.js               shared primitives (cards, tables, badges, tiles, tree,
                              toasts, live-region announce)
assets/js/views-records.js    Academic Records — 8 views
assets/js/views-more.js       Dashboard, Payments (incl. the payment flow), Reports,
                              Services, LMS, Comms, Site Map, Not found
assets/js/app.js              site map, nav, hash router, focus management, boot
```

Scripts are classic (not ES modules) and nothing uses `fetch()`, so the portal
runs from `file://` as well as from a web server.

## Routes

| Route | Page |
|---|---|
| `#/dashboard` | Overview, alerts, GPA trend, this semester, announcements |
| `#/records` | Academic Year → semester cards |
| `#/records/courses` | Enrolled courses · syllabus, lecturers, materials |
| `#/records/attendance` | Overall %, per-course rates, absence log |
| `#/records/grades` | Weighted breakdown, assessments per course |
| `#/records/exams` | Schedule, hall tickets, final marks |
| `#/records/gpa` | Cumulative, term analytics, what-if simulator |
| `#/records/transcript` | Full transcript, requests, verification |
| `#/records/calendar` | Key dates, exam weeks, holidays |
| `#/payments/fees` | Charges, balance, due dates, payment options |
| `#/payments/pay` | Settle a charge — select, review, confirm |
| `#/payments/…` | History · receipts · scholarships |
| `#/reports/…` | Academic · attendance · financial |
| `#/services`, `#/lms`, `#/communication`, `#/sitemap` | — |

Routes accept a query string: `#/records/grades?course=CS340`.

An unknown route renders a **Page not found** view rather than silently falling
through to the dashboard, so a stale link says so instead of quietly landing the
user somewhere they did not ask for.

**Navigation is the sidebar only.** Each section used to repeat its pages as a
tab strip above the content; every one of those 15 links was a duplicate of a
sidebar entry, so the strips were removed. Multiple ways to reach a page (2.4.5)
still holds via the sidebar, the breadcrumb and the site map page.

## Design decisions worth knowing

**Nothing computed is stored.** GPA, weighted course marks, attendance rates and
account balances are all derived from the records in `data.js` by the helpers at
the bottom of that file. Change a score and every page that shows it moves
together. `paid + outstanding === charged` is asserted by the ledger construction,
not by a hardcoded total.

**In-progress courses re-normalise their weights.** Semester 2's finals are
ungraded (`score: null`). Rather than counting them as zero, `coursePct()` drops
ungraded categories and re-normalises the rest, so the figure shown is standing
so far (at 75% coverage) rather than a false low.

**Charts are single-series and single-hue.** Every chart uses the brand blue
`#3458f4`, which clears the lightness band, the chroma floor and 4.5:1 as text on
both the white card (5.46:1) and the grey page plane (5.04:1) — comfortably past
the 3:1 that non-text marks need. A single series needs no legend — the chart
title names what is plotted.

Colour never carries meaning alone: every status badge pairs a glyph with a text
label, and every chart has a table of the same numbers on the same page. That
rule earns its keep — a blue series and a green status badge are close enough
under deuteranopia that neither can be the only signal. Re-measure the pair with
a colour-blindness simulator before changing `--viz-series` again.

**Light mode only.** No dark palette is defined; the tokens would need their own
validated dark steps rather than an automatic flip.

**Money moves through one function.** `recordPayment()` in `data.js` is the only
thing that writes to `Finance.payments`, and `chargeLedger()` derives every
balance from it. Settling a charge therefore updates the fees table, the
dashboard alert, history, receipts, the financial report and the transcript hold
at once, with no second source to keep in sync. `allocatePayment()` sits beside
`chargeLedger()` deliberately: it spreads a payment oldest-invoice-first in the
same order the ledger settles them, so the review screen can never promise a
split the ledger will not honour.

**Attendance rules are enforced, not decorative.** Excused absences leave the
denominator; lateness counts as present. A course under 75% raises a dashboard
alert, flags on the attendance page, and withholds its exam hall ticket — CS350
is the worked example at 72.7%.

## Accessibility

Target: **WCAG 2.2 Level AA**. Every ratio below was measured from the token
values in `app.css`, not estimated.

### Colour

| Token | Value | Measured | Floor |
|---|---|---|---|
| `--color-accent` | `#3458f4` | 5.46:1 white · 5.04:1 page · 5.14:1 sunken | 4.5:1 |
| `--color-accent-600/700` | `#2a4be0` / `#2544d6` | 6.60:1 / 7.30:1 with white text | 4.5:1 |
| `.crumbs` | `#e9ecfd` | 4.65:1 on the header bar | 4.5:1 |
| `--ink-2` | `#5b6478` | 5.93:1 on white | 4.5:1 |
| `--ink-3` | `#646c7a` | 5.29:1 white · 4.89:1 page · 4.99:1 sunken | 4.5:1 |
| `--status-good` | `#097409` | 5.98:1 on white | 4.5:1 |
| `--status-warning` | `#7d5200` | 6.82:1 on white | 4.5:1 |
| `--status-critical` | `#d03b3b` | 4.80:1 on white | 4.5:1 |
| `--viz-track` | `#6a7ff2` | 3.54:1 white · 3.27:1 page | 3:1 (non-text) |

Yellow cannot reach 4.5:1 against white at any usable saturation — that is a
property of luminance, not a design preference — so `--status-warning` reads as
a dark brown-gold. `--color-divider` is exempt: it is a decorative separator,
not an information carrier, so 1.4.11 does not apply to it.

### Focus and navigation

- A skip link targets `#view`, which carries `tabindex="-1"`.
- Route changes move focus into the new page (2.4.3) — **but not on first
  paint**, which would strand the skip link and the sidebar behind the user's
  very first Tab.
- `scroll-padding-top` sits on `html`, not `.content`: the topbar is
  `position: sticky` and the **document** is the scroll container, so on
  `.content` the property would be dead CSS and 2.4.11 would still fail.
- Changing the semester picker re-renders the page and then returns focus to the
  picker. Focus ending where it started keeps that a change of *content* rather
  than of *context*, which is why the control needs no "this reloads the page"
  warning (3.2.2).

### Status messages (4.1.3)

`#live` is a polite region announcing route changes. Transient results go
through `UI.toast(message, { status })`, which carries `role="status"` for a
success and `role="alert"` for a failure, on an inner wrapper so the close
button's label is not read as part of the message.

Auto-dismiss is a time limit, so **2.2.1 Timing Adjustable** applies. Three
things answer it: the countdown pauses on hover *and* on focus, every toast has
a close button, and nothing is announced only in a toast — the button label and
page state carry the same outcome after it has gone. `TOAST_MS = 0` in `ui.js`
turns auto-dismiss off entirely.

The attendance alert is rendered on load and sits in normal reading order, so it
is deliberately *not* a live region. Announcing static content makes a page
noisier, not more accessible.

### Forms and the payment flow

`#/payments/pay` is a financial transaction, so **3.3.4 Error Prevention (Legal,
Financial, Data)** applies. The flow takes the *Confirmed* route: a review screen
shows exactly which invoice receives what before anything is recorded, and a
guard stops a double-click paying twice.

Supporting that: `<fieldset>`/`<legend>` grouping (1.3.1), an error summary with
`role="alert"` that takes focus on a failed submit (3.3.1), messages that say
what to do rather than only what is wrong (3.3.3), and `aria-invalid` on the
fields at fault. The summary uses **buttons, not `href="#field"` anchors** — this
app routes on the hash, so an in-page anchor would navigate to a non-existent
route instead of moving focus.

Buttons that finish an action use `aria-disabled`, not the `disabled` attribute.
`disabled` destroys focus on click, dumping a keyboard user back to `<body>`.

### Verifying

There is no test runner, but two checks are worth re-running by hand after any
change, because both catch failures that are invisible in a browser:

- **Resolve every IDREF.** Render each route, extract every
  `aria-describedby` / `aria-labelledby` / `for`, and confirm each one matches an
  `id` that route actually emits. A dangling `aria-describedby` points at nothing
  and fails silently — this repo has shipped one before.
- **Re-measure the tokens** whenever a colour changes. Changing one token moves
  criteria you were not looking at: making the accent lighter for 1.4.3 pushed
  the breadcrumb *below* the floor it had previously cleared.

### Known gaps

Two things are measured, understood, and not yet fixed:

| Where | Measured | Note |
|---|---|---|
| `.brand-sub`, `.who-id`, `.crumbs .sep` | 3.59:1, 3.49:1, 2.28:1 | White at 72% / 70% / 45% on the header bar. The lighter accent made all three worse. `#e9ecfd` fixes the first two; the `/` separator is arguably decorative punctuation. |
| Meter fill vs track | 1.54:1 | The track now passes against the page, but fill and track are both blues, so the boundary that conveys the rate is faint. The value is also printed as adjacent text, so the graphic is not the only carrier. |

Not yet measured, and so not claimed: 1.4.4 Resize Text, 1.4.12 Text Spacing,
1.4.13 Content on Hover, 2.1.1 Keyboard, 2.1.2 No Keyboard Trap, 2.5.8 Target
Size. `.btn-sm` computes to roughly 27.6px tall and `.toast-close` is exactly
24×24, but measure both in DevTools rather than claiming a pass.

## Editing

- **Add a course** — push onto `SEMESTER_2.courses`; every page picks it up.
- **Add a route** — add a view object (`{ title, crumb, render, mount? }`) to
  `views-more.js`, then a nav entry in `app.js`.
- **Retune the look** — the token block at the top of `app.css` is the only place
  colour, spacing and type are defined. The ratios noted beside the accent, ink,
  status and `--viz-track` tokens are WCAG 2.2 AA floors (4.5:1 for text, 3:1
  for meaningful non-text) — re-measure them before changing those values.

## Caveats

The data is realistic but fictional. Actions that would hit a server — requesting
an official transcript, submitting a service request, sending a reply — update
the button state locally and persist nothing.

**Payments are the one action that changes state.** `#/payments/pay` records a
cleared payment through `recordPayment()`, which pushes onto `Finance.payments`
— the single record every money figure derives from. One push therefore moves
the fees table, the dashboard alert, payment history, receipts, the financial
report and the transcript hold together, with no second source to keep in sync.
It is held in memory only: reloading the page reloads `data.js` and the account
returns to its seeded $145 outstanding, so the flow can be demonstrated
repeatedly. Because a payment is a financial transaction, the flow requires an
explicit review-and-confirm step before anything is recorded (WCAG 3.3.4).
