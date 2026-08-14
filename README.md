# Academic Portal

A student portal front-end implementing the structure from the *Academic Portal
Mind Map* site map, in an indigo/white theme: a full-width blue header bar, white
cards on a cool grey plane, soft radii and hairline borders.

Open `index.html` in any browser — no build step, no server, no dependencies.

## Structure

```
index.html                    app shell (sidebar, topbar, view container)
assets/css/app.css            Modernist tokens + layout + components
assets/js/data.js             all records — and every derivation from them
assets/js/charts.js           SVG charts (line, bars, columns, sparkline, meter)
assets/js/ui.js               shared primitives (cards, tables, badges, tiles, tree)
assets/js/views-records.js    Academic Records — 8 views
assets/js/views-more.js       Dashboard, Payments, Reports, Services, LMS, Comms, Site Map
assets/js/app.js              site map, nav, hash router, boot
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
| `#/payments/…` | Fees · history · receipts · scholarships |
| `#/reports/…` | Academic · attendance · financial |
| `#/services`, `#/lms`, `#/communication`, `#/sitemap` | — |

Routes accept a query string: `#/records/grades?course=CS340`.

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
`#3b4ee0`, which clears the lightness band, the chroma floor and 3:1 contrast on
both the white card and the grey page plane. A single series needs no legend —
the chart title names what is plotted.

Colour never carries meaning alone: every status badge pairs a glyph with a text
label, and every chart has a table of the same numbers on the same page. That
rule earns its keep — the original red theme put status-green `#0ca30c` at
**ΔE 1.7** from the accent under deuteranopia (indistinguishable); blue moves the
same pair to **ΔE 34.7**. Re-run `scripts/validate_palette.js` from the dataviz
skill before changing `--viz-series` again.

**Light mode only.** No dark palette is defined; the tokens would need their own
validated dark steps rather than an automatic flip.

**Attendance rules are enforced, not decorative.** Excused absences leave the
denominator; lateness counts as present. A course under 75% raises a dashboard
alert, flags on the attendance page, and withholds its exam hall ticket — CS350
is the worked example at 72.7%.

## Editing

- **Add a course** — push onto `SEMESTER_2.courses`; every page picks it up.
- **Add a route** — add a view object (`{ title, crumb, render, mount? }`) to
  `views-more.js`, then a nav entry in `app.js`.
- **Retune the look** — the token block at the top of `app.css` is the only place
  colour, spacing and type are defined.

## Caveats

The data is realistic but fictional. Actions that would hit a server — requesting
an official transcript, submitting a service request, sending a reply — update
the button state locally and persist nothing.
