/* ═══════════════════════════════════════════════════════════════════════════
   views-records.js — Academic Records.

   Mirrors the site map exactly:
     Academic Records
       └ Academic Year → Semester 1 / Semester 2
            └ Courses · Attendance · Grades · Exams
       └ GPA · Transcript · Academic Calendar

   Each view is { title, crumb, render(ctx), mount?(root, ctx) }. ctx carries the
   selected semester and the parsed query string.
   ═══════════════════════════════════════════════════════════════════════════ */

const RecordViews = (() => {
  const { esc, icon, pageHead, card, tabs, table, statTile, badge, gradeBadge, attendanceBadge, empty } = UI;

  const TABS = [
    { label: 'Overview',   href: '#/records' },
    { label: 'Courses',    href: '#/records/courses' },
    { label: 'Attendance', href: '#/records/attendance' },
    { label: 'Grades',     href: '#/records/grades' },
    { label: 'Exams',      href: '#/records/exams' },
    { label: 'GPA',        href: '#/records/gpa' },
    { label: 'Transcript', href: '#/records/transcript' },
    { label: 'Calendar',   href: '#/records/calendar' }
  ];

  const pct1 = (n) => n.toFixed(1) + '%';
  const chrome = (route) => tabs(TABS, route);

  /* ── Overview — the Academic Year node ─────────────────────────────────── */
  const overview = {
    title: 'Academic Records',
    crumb: ['Academic Records', 'Overview'],
    render(ctx) {
      const year = ACADEMIC_YEARS[0];
      const cum = cumulativeGPA();

      const semCards = year.semesters.map((sem) => {
        const g = semesterGPA(sem);
        const att = semesterAttendance(sem);
        const graded = sem.courses.filter((c) => courseGrade(c).points !== null).length;
        const isCurrent = sem.id === ctx.sem.id;
        return card(`
          <dl class="kv">
            <dt>Status</dt><dd>${UI.statusBadge(sem.status)}</dd>
            <dt>Runs</dt><dd>${esc(fmtDate(sem.starts))} — ${esc(fmtDate(sem.ends))}</dd>
            <dt>Courses</dt><dd>${sem.courses.length} enrolled · ${sem.courses.reduce((s, c) => s + c.credits, 0)} credits</dd>
            <dt>Semester GPA</dt><dd class="num">${g ? g.gpa.toFixed(2) : '—'}${sem.status === 'In progress' ? ' <span class="text-dim text-small">(projected)</span>' : ''}</dd>
            <dt>Attendance</dt><dd class="num">${pct1(att * 100)}</dd>
            <dt>Graded</dt><dd>${graded} of ${sem.courses.length} courses</dd>
          </dl>
          <div class="page-actions" style="margin-top:var(--space-4)">
            <a class="btn btn-${isCurrent ? 'primary' : 'secondary'}" href="#/records/courses" data-select-sem="${sem.id}">
              ${isCurrent ? 'Open this semester' : 'Switch to ' + esc(sem.label)} ${icon('arrow-right', 14)}
            </a>
          </div>
        `, { title: sem.label + ' · ' + sem.year, subtitle: isCurrent ? 'Currently selected' : '' });
      }).join('');

      return chrome('#/records') + pageHead({
        kicker: 'Academic Year ' + year.label,
        title: 'Academic Records',
        lead: 'Everything the registry holds for you this year — enrolment, attendance, assessment and examination records, all derived from the same source data.'
      }) + `
        <div class="grid grid-4" style="margin-bottom:var(--space-4)">
          ${statTile({ label: 'Cumulative GPA', value: cum.gpa.toFixed(2), foot: `${cum.credits} credits counted` })}
          ${statTile({ label: 'Credits earned', value: String(cum.credits), foot: 'Across 5 completed terms' })}
          ${statTile({ label: 'Attendance this term', value: pct1(semesterAttendance(ctx.sem) * 100), foot: esc(ctx.sem.label) })}
          ${statTile({ label: 'Academic standing', value: 'Good', foot: esc(Student.standing) })}
        </div>
        <div class="grid grid-2">${semCards}</div>
        <div style="margin-top:var(--space-4)">
          ${card(table({
            head: ['Area', 'What it holds', 'Go to'],
            rows: [
              ['Courses', 'Syllabus, lecturers and materials for each enrolled course', '<a href="#/records/courses">Open courses</a>'],
              ['Attendance', 'Overall percentage per course and the full absence log', '<a href="#/records/attendance">Open attendance</a>'],
              ['Grades', 'Assignments, quizzes, projects and weighted standing', '<a href="#/records/grades">Open grades</a>'],
              ['Exams', 'Schedules, hall tickets and final marks', '<a href="#/records/exams">Open exams</a>'],
              ['GPA', 'Cumulative GPA, term analytics and the what-if simulator', '<a href="#/records/gpa">Open GPA</a>'],
              ['Transcript', 'Official and unofficial transcript requests', '<a href="#/records/transcript">Open transcript</a>'],
              ['Academic Calendar', 'Key dates, exam weeks and holidays', '<a href="#/records/calendar">Open calendar</a>']
            ]
          }), { title: 'What sits under Academic Records' })}
        </div>`;
    }
  };

  /* ── Courses ───────────────────────────────────────────────────────────── */
  const courses = {
    title: 'Courses',
    crumb: ['Academic Records', 'Courses'],
    render(ctx) {
      const sem = ctx.sem;
      const selected = courseByCode(sem, ctx.query.course) || sem.courses[0];

      const rows = sem.courses.map((c) => {
        const g = courseGrade(c);
        const on = c.code === selected.code;
        return [
          { html: `<a class="code" href="#/records/courses?course=${c.code}">${esc(c.code)}</a>` },
          esc(c.title) + (on ? ' <span class="text-dim text-small">— shown right</span>' : ''),
          { html: String(c.credits), cls: 'num right' },
          esc(c.lecturer),
          esc(c.schedule),
          { html: gradeBadge(g.letter) }
        ];
      });

      const detail = `
        <dl class="kv">
          <dt>Code</dt><dd class="code">${esc(selected.code)}</dd>
          <dt>Credits</dt><dd class="num">${selected.credits}</dd>
          <dt>Lecturer</dt><dd>${esc(selected.lecturer)}</dd>
          <dt>Schedule</dt><dd>${esc(selected.schedule)}</dd>
          <dt>Room</dt><dd>${esc(selected.room)}</dd>
          <dt>Attendance</dt><dd class="num">${pct1(attendanceRate(selected) * 100)}</dd>
        </dl>
        <hr class="hr">
        <h5>Syllabus</h5>
        <p class="text-small text-muted">${esc(selected.syllabus)}</p>
        <h5>Materials</h5>
        ${table({
          className: 'table-plain',
          head: ['File', 'Type', { label: 'Size', right: true }, ''],
          rows: selected.materials.map((m) => [
            esc(m.name), esc(m.kind),
            { html: esc(m.size), cls: 'num right' },
            { html: `<a class="btn btn-ghost btn-sm" href="#/records/courses?course=${selected.code}">${icon('download', 14)} Download</a>`, cls: 'right' }
          ])
        })}`;

      return chrome('#/records/courses') + pageHead({
        kicker: sem.label + ' · ' + sem.year,
        title: 'Courses',
        lead: 'Every course you are enrolled in this semester, with its syllabus, teaching staff and downloadable materials.'
      }) + `
        <div class="grid grid-sidebar">
          <div>${card(table({
            head: ['Code', 'Course', { label: 'Cr.', right: true }, 'Lecturer', 'Schedule', 'Standing'],
            rows
          }), { title: 'Enrolled courses', subtitle: `${sem.courses.length} courses · ${sem.courses.reduce((s, c) => s + c.credits, 0)} credits` })}</div>
          <div>${card(detail, { title: selected.title, subtitle: 'Select a course code to change this panel' })}</div>
        </div>`;
    }
  };

  /* ── Attendance ────────────────────────────────────────────────────────── */
  const attendance = {
    title: 'Attendance',
    crumb: ['Academic Records', 'Attendance'],
    render(ctx) {
      const sem = ctx.sem;
      const overall = semesterAttendance(sem);
      const atRisk = sem.courses.filter((c) => attendanceRate(c) < ATTENDANCE_THRESHOLD);

      const barData = sem.courses.map((c) => {
        const r = attendanceRate(c) * 100;
        return { label: c.code, value: r, tip: `${c.code} · ${r.toFixed(1)}% attended` };
      });

      const rows = sem.courses.map((c) => {
        const a = c.attendance;
        const r = attendanceRate(c);
        const counted = a.held - a.excused;
        const state = r < ATTENDANCE_THRESHOLD ? 'critical' : r < 0.9 ? 'warning' : '';
        return [
          { html: `<span class="code">${esc(c.code)}</span>`, },
          esc(c.title),
          { html: String(a.held), cls: 'num right' },
          { html: String(counted - a.absent), cls: 'num right' },
          { html: String(a.absent), cls: 'num right' },
          { html: String(a.late), cls: 'num right' },
          { html: String(a.excused), cls: 'num right' },
          { html: Chart.meter(r * 100, { state, valueLabel: pct1(r * 100), markAt: ATTENDANCE_THRESHOLD * 100, ariaLabel: `${c.code} attendance ${pct1(r * 100)}` }) },
          { html: attendanceBadge(r) }
        ];
      });

      const log = sem.courses.flatMap((c) => c.attendance.log.map((l) => ({ ...l, code: c.code, title: c.title })))
        .sort((a, b) => b.date.localeCompare(a.date));

      const logRows = log.map((l) => [
        { html: esc(fmtDate(l.date)), cls: 'num nowrap' },
        { html: `<span class="code">${esc(l.code)}</span>` },
        esc(l.title),
        { html: l.status === 'Absent' ? badge('critical', 'Absent') : l.status === 'Late' ? badge('warning', 'Late') : badge('neutral', 'Excused') },
        `<span class="text-muted text-small">${esc(l.note)}</span>`
      ]);

      return chrome('#/records/attendance') + pageHead({
        kicker: sem.label + ' · ' + sem.year,
        title: 'Attendance',
        lead: `Excused absences are removed from the denominator; lateness still counts as present. Falling below ${ATTENDANCE_THRESHOLD * 100}% in a course bars you from its final examination.`
      }) + `
        <div class="grid grid-4" style="margin-bottom:var(--space-4)">
          ${statTile({ label: 'Overall this semester', value: pct1(overall * 100), foot: `Across ${sem.courses.length} courses` })}
          ${statTile({ label: 'Sessions held', value: String(sem.courses.reduce((s, c) => s + c.attendance.held, 0)), foot: 'Counting all courses' })}
          ${statTile({ label: 'Unexcused absences', value: String(sem.courses.reduce((s, c) => s + c.attendance.absent, 0)), foot: 'Counted against your rate' })}
          ${statTile({ label: 'Courses below threshold', value: String(atRisk.length), foot: atRisk.length ? atRisk.map((c) => c.code).join(', ') : 'None — all clear' })}
        </div>

        ${atRisk.length ? `<div style="margin-bottom:var(--space-4)">${card(
          `<p style="margin:0">${atRisk.map((c) => `<strong>${esc(c.code)} ${esc(c.title)}</strong> is at ${pct1(attendanceRate(c) * 100)}, below the ${ATTENDANCE_THRESHOLD * 100}% requirement.`).join(' ')} Contact the lecturer to agree a recovery plan before the examination period.</p>`,
          { title: '⚠ Action needed' }
        )}</div>` : ''}

        <div style="margin-bottom:var(--space-4)">${card(
          `<p class="chart-title">Attendance rate by course — the dashed line marks the ${ATTENDANCE_THRESHOLD * 100}% requirement.</p>` +
          Chart.bars({ data: barData, max: 100, threshold: ATTENDANCE_THRESHOLD * 100, thresholdLabel: `${ATTENDANCE_THRESHOLD * 100}% required`, aria: 'Attendance rate by course' }) +
          `<div class="legend"><span class="legend-item"><span class="legend-swatch"></span>Attendance rate</span><span class="legend-item"><span class="legend-swatch is-dashed"></span>Minimum required</span></div>`,
          { title: 'Rate by course' }
        )}</div>

        <div style="margin-bottom:var(--space-4)">${card(table({
          head: ['Code', 'Course', { label: 'Held', right: true }, { label: 'Present', right: true }, { label: 'Absent', right: true }, { label: 'Late', right: true }, { label: 'Excused', right: true }, 'Rate', 'Status'],
          rows
        }), { title: 'Per-course record', subtitle: 'The table view of the chart above' })}</div>

        ${card(logRows.length ? table({ head: ['Date', 'Code', 'Course', 'Status', 'Note'], rows: logRows })
          : empty('No absences recorded', 'You have attended every session this semester.'),
          { title: 'Absence log', subtitle: `${log.length} entries` })}`;
    }
  };

  /* ── Grades ────────────────────────────────────────────────────────────── */
  const grades = {
    title: 'Grades',
    crumb: ['Academic Records', 'Grades'],
    render(ctx) {
      const sem = ctx.sem;
      const selected = courseByCode(sem, ctx.query.course) || sem.courses[0];
      const g = semesterGPA(sem);

      const summaryRows = sem.courses.map((c) => {
        const cg = courseGrade(c);
        const on = c.code === selected.code;
        return [
          { html: `<a class="code" href="#/records/grades?course=${c.code}">${esc(c.code)}</a>` },
          esc(c.title) + (on ? ' <span class="text-dim text-small">— shown below</span>' : ''),
          { html: String(c.credits), cls: 'num right' },
          { html: cg.pct === null ? '—' : pct1(cg.pct), cls: 'num right' },
          { html: gradeBadge(cg.letter) },
          { html: cg.points === null ? '—' : cg.points.toFixed(1), cls: 'num right' },
          { html: `<span class="text-small text-muted num">${Math.round(cg.coverage * 100)}%</span>` }
        ];
      });

      // Weighted breakdown for the selected course.
      const catRows = Object.entries(WEIGHTS).map(([cat, weight]) => {
        const pct = categoryPct(selected, cat);
        const items = selected.assessments.filter((a) => a.category === cat);
        const gradedItems = items.filter((a) => a.score !== null).length;
        return [
          esc(cat),
          { html: (weight * 100).toFixed(0) + '%', cls: 'num right' },
          { html: `${gradedItems} of ${items.length}`, cls: 'num right' },
          { html: pct === null ? '<span class="text-dim">Not graded</span>' : pct1(pct), cls: 'num right' },
          // Contribution = the category's average scaled by its weight, i.e. the
          // points it actually puts on the board out of the 100 available.
          { html: pct === null ? '<span class="text-dim">—</span>' : Chart.meter(pct, { valueLabel: (pct * weight).toFixed(1) + ' pts', ariaLabel: `${cat} ${pct1(pct)}` }) }
        ];
      });

      const assessRows = selected.assessments.map((a) => [
        esc(a.category),
        esc(a.title),
        { html: esc(fmtDate(a.due)), cls: 'num nowrap' },
        { html: a.score === null ? '<span class="text-dim">Pending</span>' : `${a.score} / ${a.max}`, cls: 'num right' },
        { html: a.score === null ? '<span class="text-dim">—</span>' : pct1((a.score / a.max) * 100), cls: 'num right' }
      ]);

      const cg = courseGrade(selected);

      return chrome('#/records/grades') + pageHead({
        kicker: sem.label + ' · ' + sem.year,
        title: 'Grades',
        lead: 'Course marks are weighted ' + Object.entries(WEIGHTS).map(([k, v]) => `${k.toLowerCase()} ${v * 100}%`).join(', ') +
              '. While a course is in progress, ungraded categories are dropped and the remaining weights re-normalised, so the figure shown is your standing so far.'
      }) + `
        <div class="grid grid-4" style="margin-bottom:var(--space-4)">
          ${statTile({ label: 'Semester GPA', value: g ? g.gpa.toFixed(2) : '—', foot: sem.status === 'In progress' ? 'Projected from graded work' : 'Final' })}
          ${statTile({ label: 'Credits in progress', value: String(sem.courses.reduce((s, c) => s + c.credits, 0)), foot: `${sem.courses.length} courses` })}
          ${statTile({ label: 'Best course', value: (() => { const b = sem.courses.map((c) => ({ c, g: courseGrade(c) })).filter((x) => x.g.pct !== null).sort((a, b) => b.g.pct - a.g.pct)[0]; return b ? b.c.code : '—'; })(), foot: 'Highest weighted standing' })}
          ${statTile({ label: 'Needs attention', value: (() => { const w = sem.courses.map((c) => ({ c, g: courseGrade(c) })).filter((x) => x.g.pct !== null && x.g.pct < 75); return w.length ? w[0].c.code : 'None'; })(), foot: 'Below a B grade' })}
        </div>

        <div style="margin-bottom:var(--space-4)">${card(table({
          head: ['Code', 'Course', { label: 'Cr.', right: true }, { label: 'Weighted', right: true }, 'Grade', { label: 'Points', right: true }, 'Assessed'],
          rows: summaryRows
        }), { title: 'All courses this semester', subtitle: 'Select a code to break it down below' })}</div>

        <div class="grid grid-2">
          ${card(table({
            head: ['Category', { label: 'Weight', right: true }, { label: 'Items', right: true }, { label: 'Average', right: true }, 'Contribution'],
            rows: catRows
          }) + `<p class="card-note">Weighted standing: <strong class="num">${cg.pct === null ? '—' : pct1(cg.pct)}</strong> ${gradeBadge(cg.letter)} — based on ${Math.round(cg.coverage * 100)}% of the course weight.</p>`,
            { title: selected.code + ' — weighting', subtitle: esc(selected.title) })}
          ${card(table({
            head: ['Category', 'Assessment', 'Due', { label: 'Score', right: true }, { label: '%', right: true }],
            rows: assessRows
          }), { title: selected.code + ' — assessments', subtitle: `${selected.assessments.length} items` })}
        </div>`;
    }
  };

  /* ── Exams ─────────────────────────────────────────────────────────────── */
  const exams = {
    title: 'Exams',
    crumb: ['Academic Records', 'Exams'],
    render(ctx) {
      const sem = ctx.sem;
      const list = sem.exams;
      const selected = list.find((e) => e.code === ctx.query.exam) || list[0];
      const graded = list.filter((e) => e.mark !== null);

      const scheduleRows = list.map((e) => {
        const days = daysFrom(e.date);
        const course = courseByCode(sem, e.code);
        const blocked = course && attendanceRate(course) < ATTENDANCE_THRESHOLD;
        return [
          { html: `<a class="code" href="#/records/exams?exam=${e.code}">${esc(e.code)}</a>` },
          esc(e.title),
          { html: esc(fmtDate(e.date)), cls: 'num nowrap' },
          { html: esc(e.time), cls: 'num nowrap' },
          esc(e.room),
          { html: esc(e.seat), cls: 'num' },
          { html: blocked ? badge('critical', 'Attendance hold') : UI.statusBadge(e.ticket) },
          { html: days > 0 ? `<span class="text-small text-muted num">in ${days} days</span>` : `<span class="text-small text-dim">sat</span>` }
        ];
      });

      const marksRows = graded.map((e) => {
        const g = gradeFor(e.mark);
        return [
          { html: `<span class="code">${esc(e.code)}</span>` },
          esc(e.title),
          { html: String(e.mark), cls: 'num right' },
          { html: gradeBadge(g.letter) },
          { html: g.points.toFixed(1), cls: 'num right' }
        ];
      });

      const course = courseByCode(sem, selected.code);
      const blocked = course && attendanceRate(course) < ATTENDANCE_THRESHOLD;

      const ticket = `
        <div class="kv" style="grid-template-columns:auto 1fr">
          <dt>Candidate</dt><dd><strong>${esc(Student.name)}</strong></dd>
          <dt>Student ID</dt><dd class="num">${esc(Student.id)}</dd>
          <dt>Programme</dt><dd>${esc(Student.program)}</dd>
          <dt>Course</dt><dd><span class="code">${esc(selected.code)}</span> ${esc(selected.title)}</dd>
          <dt>Date</dt><dd class="num">${esc(fmtDate(selected.date))}</dd>
          <dt>Time</dt><dd class="num">${esc(selected.time)}</dd>
          <dt>Venue</dt><dd>${esc(selected.room)} · seat <span class="num">${esc(selected.seat)}</span></dd>
          <dt>Status</dt><dd>${blocked ? badge('critical', 'Blocked — attendance below threshold') : UI.statusBadge(selected.ticket)}</dd>
        </div>
        <hr class="hr">
        <p class="text-small text-muted">Bring this ticket and your student ID card. Candidates arriving more than 30 minutes after the start are not admitted. Electronic devices must be switched off and left at the front of the hall.</p>
        <div class="page-actions">
          <button class="btn btn-primary" type="button" data-print${blocked ? ' disabled' : ''}>${icon('file-text', 14)} Print hall ticket</button>
          <a class="btn btn-secondary" href="#/records/attendance">Check attendance</a>
        </div>`;

      return chrome('#/records/exams') + pageHead({
        kicker: sem.label + ' · ' + sem.year,
        title: 'Exams',
        lead: 'Examination schedule, hall tickets and final marks. A hall ticket is withheld automatically while a course sits below the attendance requirement.'
      }) + `
        <div class="grid grid-4" style="margin-bottom:var(--space-4)">
          ${statTile({ label: 'Papers scheduled', value: String(list.length), foot: esc(sem.label) })}
          ${statTile({ label: 'Tickets issued', value: String(list.filter((e) => e.ticket === 'Issued').length) + ' / ' + list.length, foot: 'Ready to print' })}
          ${statTile({ label: 'Marks published', value: String(graded.length) + ' / ' + list.length, foot: graded.length ? 'Released by the registry' : 'Pending results' })}
          ${statTile({ label: 'Average mark', value: graded.length ? (graded.reduce((s, e) => s + e.mark, 0) / graded.length).toFixed(1) : '—', foot: 'Final papers only' })}
        </div>

        <div class="grid grid-sidebar" style="margin-bottom:var(--space-4)">
          <div>${card(table({
            head: ['Code', 'Paper', 'Date', 'Time', 'Hall', 'Seat', 'Ticket', ''],
            rows: scheduleRows
          }), { title: 'Examination schedule', subtitle: 'Select a code to load its hall ticket' })}</div>
          <div>${card(ticket, { title: 'Hall ticket', subtitle: selected.code + ' · ' + selected.room })}</div>
        </div>

        ${card(graded.length ? table({
          head: ['Code', 'Paper', { label: 'Mark', right: true }, 'Grade', { label: 'Points', right: true }],
          rows: marksRows
        }) : empty('No marks yet', 'Final marks appear here once the registry publishes results for this semester.'),
          { title: 'Final marks', subtitle: graded.length ? `${graded.length} published` : 'Awaiting publication' })}`;
    },
    mount(root) {
      const btn = root.querySelector('[data-print]');
      if (btn) btn.addEventListener('click', () => window.print());
    }
  };

  /* ── GPA ───────────────────────────────────────────────────────────────── */
  const gpa = {
    title: 'GPA',
    crumb: ['Academic Records', 'GPA'],
    render(ctx) {
      const history = termHistory();
      const cum = cumulativeGPA();
      const best = history.reduce((a, b) => (b.gpa > a.gpa ? b : a));
      const trend = history[history.length - 1].gpa - history[history.length - 2].gpa;

      const trendData = history.map((t) => ({
        label: t.short, value: t.gpa,
        tip: `${t.label} · GPA ${t.gpa.toFixed(2)} over ${t.credits} credits`
      }));

      const termRows = history.map((t) => [
        esc(t.label),
        { html: t.gpa.toFixed(2), cls: 'num right' },
        { html: String(t.credits), cls: 'num right' },
        { html: (t.gpa * t.credits).toFixed(1), cls: 'num right' },
        { html: UI.statusBadge(t.status) }
      ]);

      // What-if: the in-progress semester, each course defaulting to its current standing.
      const simCourses = SEMESTER_2.courses.map((c) => ({ course: c, current: courseGrade(c) }));
      const simRows = simCourses.map(({ course, current }) => `
        <tr>
          <td><span class="code">${esc(course.code)}</span></td>
          <td>${esc(course.title)}</td>
          <td class="num right">${course.credits}</td>
          <td class="num right text-muted">${current.pct === null ? '—' : pct1(current.pct)}</td>
          <td>
            <label class="sr-only" for="sim-${course.code}">Projected grade for ${esc(course.code)}</label>
            <select class="input" id="sim-${course.code}" data-sim data-credits="${course.credits}">
              ${GRADE_SCALE.map((s) => `<option value="${s.points}"${s.letter === current.letter ? ' selected' : ''}>${s.letter} — ${s.points.toFixed(1)}</option>`).join('')}
            </select>
          </td>
        </tr>`).join('');

      return chrome('#/records/gpa') + pageHead({
        kicker: 'Academic Records',
        title: 'GPA',
        lead: 'Credit-weighted on a 4.0 scale. Every figure here is computed from the same course records — nothing is stored separately.'
      }) + `
        <div class="grid grid-4" style="margin-bottom:var(--space-4)">
          ${statTile({ label: 'Cumulative GPA', value: cum.gpa.toFixed(2), foot: `${cum.credits} credits · 5 terms`, spark: Chart.sparkline(history.map((t) => t.gpa)) })}
          ${statTile({ label: 'Latest term', value: history[history.length - 1].gpa.toFixed(2), foot: `${trend >= 0 ? '▲' : '▼'} ${Math.abs(trend).toFixed(2)} vs previous term` })}
          ${statTile({ label: 'Best term', value: best.gpa.toFixed(2), foot: esc(best.label) })}
          ${statTile({ label: 'Scholarship floor', value: '3.40', foot: cum.gpa >= 3.4 ? 'Merit award retained' : 'Below renewal threshold' })}
        </div>

        <div style="margin-bottom:var(--space-4)">${card(
          `<p class="chart-title">Term GPA across every completed semester, oldest first. Only the latest value is labelled — hover any point for its term and credit load.</p>` +
          Chart.line({ data: trendData, yMin: 2, yMax: 4, tickCount: 4, format: (v) => v.toFixed(1), aria: 'Term GPA trend across five completed semesters' }),
          { title: 'Term GPA analytics', subtitle: 'Completed terms only — the in-progress semester is excluded' }
        )}</div>

        <div class="grid grid-2">
          ${card(table({
            head: ['Term', { label: 'GPA', right: true }, { label: 'Credits', right: true }, { label: 'Quality pts', right: true }, 'Status'],
            rows: termRows,
            foot: [{ html: '<strong>Cumulative</strong>' }, { html: '<strong>' + cum.gpa.toFixed(2) + '</strong>', cls: 'num right' }, { html: '<strong>' + cum.credits + '</strong>', cls: 'num right' }, { html: '<strong>' + history.reduce((s, t) => s + t.gpa * t.credits, 0).toFixed(1) + '</strong>', cls: 'num right' }, { html: '' }]
          }), { title: 'Term by term', subtitle: 'The table view of the chart above' })}

          ${card(`
            <p class="text-small text-muted">Set a projected grade for each in-progress course to see where the semester lands — and what it does to your cumulative GPA.</p>
            <div class="table-wrap"><table class="table table-plain">
              <thead><tr><th>Code</th><th>Course</th><th class="right">Cr.</th><th class="right">Now</th><th>Projected</th></tr></thead>
              <tbody>${simRows}</tbody>
            </table></div>
            <hr class="hr">
            <div class="grid grid-2">
              <div><span class="stat-label">Projected semester GPA</span><div class="hero-figure num" data-sim-term>—</div></div>
              <div><span class="stat-label">Projected cumulative</span><div class="hero-figure num" data-sim-cum>—</div>
                <p class="text-small text-muted" data-sim-note style="margin-top:var(--space-2)"></p></div>
            </div>
            <div class="page-actions"><button class="btn btn-secondary btn-sm" type="button" data-sim-reset>Reset to current standing</button></div>
          `, { title: 'What-if simulator', subtitle: 'Semester 2 · 2025–2026' })}
        </div>`;
    },
    mount(root) {
      const selects = [...root.querySelectorAll('[data-sim]')];
      const termEl = root.querySelector('[data-sim-term]');
      const cumEl = root.querySelector('[data-sim-cum]');
      const noteEl = root.querySelector('[data-sim-note]');
      const resetBtn = root.querySelector('[data-sim-reset]');
      if (!selects.length || !termEl) return;

      const base = cumulativeGPA();          // completed terms only
      const defaults = selects.map((s) => s.value);

      function recompute() {
        let pts = 0, credits = 0;
        for (const s of selects) {
          const cr = +s.dataset.credits;
          pts += (+s.value) * cr;
          credits += cr;
        }
        const term = credits ? pts / credits : 0;
        const cum = (base.gpa * base.credits + pts) / (base.credits + credits);
        termEl.textContent = term.toFixed(2);
        cumEl.textContent = cum.toFixed(2);
        const delta = cum - base.gpa;
        const dir = delta >= 0 ? 'up' : 'down';
        noteEl.textContent =
          `${delta >= 0 ? '+' : ''}${delta.toFixed(2)} against your current ${base.gpa.toFixed(2)} — ` +
          `cumulative moves ${dir} once these ${credits} credits are counted. ` +
          (cum >= 3.4 ? 'Merit scholarship stays renewed.' : 'Below the 3.40 scholarship renewal floor.');
      }

      selects.forEach((s) => s.addEventListener('change', recompute));
      if (resetBtn) resetBtn.addEventListener('click', () => {
        selects.forEach((s, i) => { s.value = defaults[i]; });
        recompute();
      });
      recompute();
    }
  };

  /* ── Transcript ────────────────────────────────────────────────────────── */
  const transcript = {
    title: 'Transcript',
    crumb: ['Academic Records', 'Transcript'],
    render() {
      const cum = cumulativeGPA();
      const history = termHistory();

      const termBlocks = PRIOR_TERMS.map((t) => {
        const r = priorTermGPA(t);
        return card(table({
          className: 'table-plain',
          head: ['Code', 'Course', { label: 'Cr.', right: true }, 'Grade', { label: 'Points', right: true }],
          rows: t.courses.map((c) => [
            { html: `<span class="code">${esc(c.code)}</span>` },
            esc(c.title),
            { html: String(c.credits), cls: 'num right' },
            { html: gradeBadge(c.letter) },
            { html: pointsFor(c.letter).toFixed(1), cls: 'num right' }
          ]),
          foot: [{ html: '<strong>Term GPA</strong>' }, { html: '' }, { html: '<strong>' + r.credits + '</strong>', cls: 'num right' }, { html: '' }, { html: '<strong>' + r.gpa.toFixed(2) + '</strong>', cls: 'num right' }]
        }), { title: t.label, subtitle: t.year });
      }).join('');

      const s1 = semesterGPA(SEMESTER_1);
      const currentBlock = card(table({
        className: 'table-plain',
        head: ['Code', 'Course', { label: 'Cr.', right: true }, 'Grade', { label: 'Points', right: true }],
        rows: SEMESTER_1.courses.map((c) => {
          const g = courseGrade(c);
          return [
            { html: `<span class="code">${esc(c.code)}</span>` },
            esc(c.title),
            { html: String(c.credits), cls: 'num right' },
            { html: gradeBadge(g.letter) },
            { html: g.points.toFixed(1), cls: 'num right' }
          ];
        }),
        foot: [{ html: '<strong>Term GPA</strong>' }, { html: '' }, { html: '<strong>' + s1.credits + '</strong>', cls: 'num right' }, { html: '' }, { html: '<strong>' + s1.gpa.toFixed(2) + '</strong>', cls: 'num right' }]
      }), { title: 'Year 3 · Semester 1', subtitle: SEMESTER_1.year });

      return chrome('#/records/transcript') + pageHead({
        kicker: 'Academic Records',
        title: 'Transcript',
        lead: 'A complete record of every completed term. The unofficial copy is available immediately; an official sealed copy is issued by the registry on request.',
        actions: `<button class="btn btn-primary" type="button" data-print>${icon('download', 14)} Download unofficial (PDF)</button>
                  <button class="btn btn-secondary" type="button" data-request>Request official copy</button>`
      }) + `
        <div style="margin-bottom:var(--space-4)">${card(`
          <div class="grid grid-4">
            <div><span class="stat-label">Student</span><div><strong>${esc(Student.name)}</strong></div><span class="text-small text-muted num">${esc(Student.id)}</span></div>
            <div><span class="stat-label">Programme</span><div>${esc(Student.program)}</div><span class="text-small text-muted">${esc(Student.faculty)}</span></div>
            <div><span class="stat-label">Cumulative GPA</span><div class="stat-value num" style="font-size:25px">${cum.gpa.toFixed(2)}</div></div>
            <div><span class="stat-label">Credits earned</span><div class="stat-value num" style="font-size:25px">${cum.credits}</div></div>
          </div>`, { title: 'Academic summary', subtitle: `Enrolled ${fmtDate(Student.enrolled)} · ${Student.standing}` })}</div>

        <div class="grid grid-2" style="margin-bottom:var(--space-4)">${termBlocks}${currentBlock}</div>

        <div class="grid grid-2">
          ${card(table({
            head: ['Term', { label: 'GPA', right: true }, { label: 'Credits', right: true }],
            rows: history.map((t) => [esc(t.label), { html: t.gpa.toFixed(2), cls: 'num right' }, { html: String(t.credits), cls: 'num right' }]),
            foot: [{ html: '<strong>Cumulative</strong>' }, { html: '<strong>' + cum.gpa.toFixed(2) + '</strong>', cls: 'num right' }, { html: '<strong>' + cum.credits + '</strong>', cls: 'num right' }]
          }), { title: 'Term summary' })}
          ${card(`
            <dl class="kv">
              <dt>Document</dt><dd>Unofficial transcript</dd>
              <dt>Generated</dt><dd class="num">${esc(fmtDate(TODAY))}</dd>
              <dt>Verification code</dt><dd class="num code">TR-${esc(Student.id.replace(/\D/g, ''))}-8841</dd>
              <dt>Verify at</dt><dd>registry.student.edu.kh/verify</dd>
            </dl>
            <hr class="hr">
            <p class="text-small text-muted">An unofficial transcript carries a verification code that a third party can check against the registry. It is not sealed and is not accepted for credit transfer — request the official copy for that. Official copies take five working days and cost $10.</p>
            <div class="page-actions"><button class="btn btn-secondary btn-sm" type="button" data-request>Request official copy</button></div>
          `, { title: 'Verification' })}
        </div>`;
    },
    mount(root) {
      const print = root.querySelector('[data-print]');
      if (print) print.addEventListener('click', () => window.print());
      root.querySelectorAll('[data-request]').forEach((b) =>
        b.addEventListener('click', () => {
          b.textContent = '✓ Request submitted — SR-4502';
          b.disabled = true;
        }));
    }
  };

  /* ── Academic Calendar ─────────────────────────────────────────────────── */
  const calendar = {
    title: 'Academic Calendar',
    crumb: ['Academic Records', 'Academic Calendar'],
    render() {
      const kindBadge = (k) => k === 'Holiday' ? badge('neutral', k) : k === 'Exam week' ? badge('critical', k) : k === 'Deadline' ? badge('warning', k) : badge('accent', k);
      const upcoming = CalendarEvents.filter((e) => daysFrom(e.date) >= 0);
      const past = CalendarEvents.filter((e) => daysFrom(e.date) < 0);

      const rowsFor = (list) => list.map((e) => {
        const d = daysFrom(e.date);
        return [
          { html: esc(fmtDate(e.date)) + (e.until ? ` <span class="text-dim">— ${esc(fmtDateShort(e.until))}</span>` : ''), cls: 'num nowrap' },
          esc(e.title),
          { html: kindBadge(e.kind) },
          { html: d === 0 ? '<strong>Today</strong>' : d > 0 ? `<span class="text-muted num">in ${d} days</span>` : `<span class="text-dim num">${Math.abs(d)} days ago</span>`, cls: 'right' }
        ];
      });

      const next = upcoming[0];

      return chrome('#/records/calendar') + pageHead({
        kicker: 'Academic Year ' + ACADEMIC_YEARS[0].label,
        title: 'Academic Calendar',
        lead: 'Key dates, examination weeks and holidays published by the registry for the current academic year.'
      }) + `
        <div class="grid grid-4" style="margin-bottom:var(--space-4)">
          ${statTile({ label: 'Next event', value: next ? fmtDateShort(next.date) : '—', foot: next ? esc(next.title) : 'Nothing scheduled' })}
          ${statTile({ label: 'Upcoming', value: String(upcoming.length), foot: 'Events still ahead' })}
          ${statTile({ label: 'Exam weeks', value: String(CalendarEvents.filter((e) => e.kind === 'Exam week').length), foot: 'This academic year' })}
          ${statTile({ label: 'Holidays', value: String(CalendarEvents.filter((e) => e.kind === 'Holiday').length), foot: 'Campus closed' })}
        </div>
        <div style="margin-bottom:var(--space-4)">${card(table({ head: ['Date', 'Event', 'Type', { label: 'When', right: true }], rows: rowsFor(upcoming) }),
          { title: 'Upcoming', subtitle: `${upcoming.length} events ahead` })}</div>
        ${card(past.length ? table({ head: ['Date', 'Event', 'Type', { label: 'When', right: true }], rows: rowsFor(past) })
          : empty('Nothing past', 'The academic year has not started yet.'), { title: 'Already passed' })}`;
    }
  };

  return {
    'records': overview,
    'records/courses': courses,
    'records/attendance': attendance,
    'records/grades': grades,
    'records/exams': exams,
    'records/gpa': gpa,
    'records/transcript': transcript,
    'records/calendar': calendar
  };
})();
