/* ═══════════════════════════════════════════════════════════════════════════
   views-more.js — Dashboard, Payments, Reports, Student Services,
   Learning Management, Communication and the Site Map.
   ═══════════════════════════════════════════════════════════════════════════ */

const MoreViews = (() => {
  const { esc, icon, pageHead, card, tabs, table, statTile, badge, gradeBadge, attendanceBadge, payBadge, statusBadge, empty } = UI;
  const pct1 = (n) => n.toFixed(1) + '%';

  /* ── Dashboard ─────────────────────────────────────────────────────────── */
  const dashboard = {
    title: 'Dashboard',
    crumb: ['Dashboard'],
    render() {
      // The dashboard reports "now", so it always reads the running semester —
      // it deliberately does not follow the Academic Records term picker.
      const sem = activeSemester();
      const cum = cumulativeGPA();
      const fin = financeSummary();
      const att = semesterAttendance(sem);
      const history = termHistory();
      const nextExam = sem.exams.filter((e) => daysFrom(e.date) >= 0)[0] || sem.exams[0];
      const atRisk = sem.courses.filter((c) => attendanceRate(c) < ATTENDANCE_THRESHOLD);
      const dueSoon = LMS.assignments.filter((a) => a.status !== 'Submitted').slice(0, 4);

      const alerts = [];
      if (fin.outstanding > 0) alerts.push({ state: 'warning', text: `${money(fin.outstanding)} outstanding on your account — next due ${fmtDate(fin.nextDue.due)}.`, href: '#/payments/fees', cta: 'Pay fees' });
      atRisk.forEach((c) => alerts.push({ state: 'critical', text: `${c.code} attendance is ${pct1(attendanceRate(c) * 100)}, below the ${ATTENDANCE_THRESHOLD * 100}% requirement.`, href: '#/records/attendance', cta: 'View attendance' }));
      const unread = Messages.filter((m) => m.unread).length;
      if (unread) alerts.push({ state: 'accent', text: `${unread} unread message${unread > 1 ? 's' : ''} from faculty.`, href: '#/communication', cta: 'Open messages' });

      return pageHead({
        kicker: 'Welcome back',
        title: Student.name.split(' ').slice(-1)[0] + ' — here is where you stand',
        lead: `${sem.label} of ${sem.year} · ${Student.program} · Year ${Student.year}`
      }) + `
        <div class="grid grid-4" style="margin-bottom:var(--space-4)">
          ${statTile({ label: 'Cumulative GPA', value: cum.gpa.toFixed(2), foot: `${cum.credits} credits earned`, spark: Chart.sparkline(history.map((t) => t.gpa)) })}
          ${statTile({ label: 'Attendance this term', value: pct1(att * 100), foot: atRisk.length ? `${atRisk.length} course below threshold` : 'All courses clear' })}
          ${statTile({ label: 'Outstanding balance', value: money(fin.outstanding), foot: fin.nextDue ? `Due ${fmtDate(fin.nextDue.due)}` : 'Nothing owed' })}
          ${statTile({ label: 'Next examination', value: nextExam ? fmtDateShort(nextExam.date) : '—', foot: nextExam ? `${nextExam.code} · ${nextExam.room}` : 'None scheduled' })}
        </div>

        ${alerts.length ? `<div style="margin-bottom:var(--space-4)">${card(
          `<div class="rows">${alerts.map((a) => `
            <div class="row-item">
              <div class="when">${badge(a.state, a.state === 'critical' ? 'Action' : a.state === 'warning' ? 'Due' : 'New')}</div>
              <div class="what"><p>${esc(a.text)}</p></div>
              <div><a class="btn btn-ghost btn-sm" href="${a.href}">${esc(a.cta)} ${icon('arrow-right', 13)}</a></div>
            </div>`).join('')}</div>`,
          { title: 'Needs your attention', subtitle: `${alerts.length} item${alerts.length > 1 ? 's' : ''}` })}</div>` : ''}

        <div class="grid grid-sidebar" style="margin-bottom:var(--space-4)">
          <div>${card(
            `<p class="chart-title">Your term GPA across every completed semester. Only the latest point is labelled — hover for the rest.</p>` +
            Chart.line({
              data: history.map((t) => ({ label: t.short, value: t.gpa, tip: `${t.label} · GPA ${t.gpa.toFixed(2)}` })),
              yMin: 2, yMax: 4, format: (v) => v.toFixed(1), aria: 'Term GPA trend'
            }) +
            `<p class="card-note"><a href="#/records/gpa">Open GPA analytics and the what-if simulator ${icon('arrow-right', 13)}</a></p>`,
            { title: 'Academic trend', subtitle: 'Completed terms' })}</div>
          <div>${card(
            `<div class="rows">${sem.courses.map((c) => {
              const g = courseGrade(c);
              return `<div class="row-item">
                <div class="what">
                  <h5><span class="code">${esc(c.code)}</span> ${esc(c.title)}</h5>
                  <p>${esc(c.schedule)} · ${esc(c.room)}</p>
                </div>
                <div>${gradeBadge(g.letter)}</div>
              </div>`;
            }).join('')}</div>`,
            { title: 'This semester', subtitle: `${sem.courses.length} courses` })}</div>
        </div>

        <div class="grid grid-2">
          ${card(`<div class="rows">${Announcements.slice(0, 3).map((a) => `
            <div class="row-item">
              <div class="when">${esc(fmtDateShort(a.date))}</div>
              <div class="what"><h5>${esc(a.title)}</h5><p>${esc(a.from)}</p></div>
            </div>`).join('')}</div>
            <p class="card-note"><a href="#/communication">All announcements ${icon('arrow-right', 13)}</a></p>`,
            { title: 'Announcements' })}
          ${card(dueSoon.length ? `<div class="rows">${dueSoon.map((a) => `
            <div class="row-item">
              <div class="when">${esc(fmtDateShort(a.due))}</div>
              <div class="what"><h5>${esc(a.title)}</h5><p><span class="code">${esc(a.course)}</span></p></div>
              <div>${statusBadge(a.status)}</div>
            </div>`).join('')}</div>
            <p class="card-note"><a href="#/lms">Open learning management ${icon('arrow-right', 13)}</a></p>` : empty('Nothing due', 'No open assignments.'),
            { title: 'Assignments due' })}
        </div>`;
    }
  };

  /* ── Payments ──────────────────────────────────────────────────────────── */
  const PAY_TABS = [
    { label: 'Tuition fees',    href: '#/payments/fees' },
    { label: 'Payment history', href: '#/payments/history' },
    { label: 'Receipts',        href: '#/payments/receipts' },
    { label: 'Scholarships',    href: '#/payments/scholarships' }
  ];

  const fees = {
    title: 'Tuition Fees',
    crumb: ['Payments', 'Tuition fees'],
    render() {
      const fin = financeSummary();
      const paidPct = fin.charged ? (fin.paid / fin.charged) * 100 : 0;

      const rows = fin.ledger.map((c) => [
        { html: `<span class="code">${esc(c.id)}</span>` },
        esc(c.desc),
        { html: esc(fmtDate(c.due)), cls: 'num nowrap' },
        { html: money(c.amount), cls: 'num right' },
        { html: money(c.paid), cls: 'num right' },
        { html: money(c.outstanding), cls: 'num right' },
        { html: payBadge(c.state) }
      ]);

      return tabs(PAY_TABS, '#/payments/fees') + pageHead({
        kicker: 'Payments',
        title: 'Tuition fees',
        lead: 'Every charge raised against your account, what has been settled, and what remains. Registration is blocked while a balance is outstanding.',
        actions: `<a class="btn btn-primary" href="#/payments/history">Make a payment</a>`
      }) + `
        <div class="grid grid-4" style="margin-bottom:var(--space-4)">
          ${statTile({ label: 'Total charged', value: money(fin.charged), foot: `${fin.ledger.length} charges this year` })}
          ${statTile({ label: 'Settled', value: money(fin.paid), foot: `${paidPct.toFixed(0)}% of total` })}
          ${statTile({ label: 'Outstanding', value: money(fin.outstanding), foot: fin.nextDue ? `Next due ${fmtDate(fin.nextDue.due)}` : 'Nothing owed' })}
          ${statTile({ label: 'Pending clearance', value: money(fin.pending), foot: 'Submitted, not yet cleared' })}
        </div>

        <div style="margin-bottom:var(--space-4)">${card(
          `<p class="chart-title">Settled against total charged for ${esc(ACADEMIC_YEARS[0].label)}.</p>` +
          Chart.meter(paidPct, { valueLabel: paidPct.toFixed(0) + '%', ariaLabel: `${paidPct.toFixed(0)} percent of fees settled` }) +
          `<p class="card-note">${money(fin.paid)} settled of ${money(fin.charged)} charged — <strong>${money(fin.outstanding)}</strong> remains.</p>`,
          { title: 'Balance' })}</div>

        <div style="margin-bottom:var(--space-4)">${card(table({
          head: ['Invoice', 'Description', 'Due', { label: 'Amount', right: true }, { label: 'Paid', right: true }, { label: 'Outstanding', right: true }, 'Status'],
          rows,
          foot: [{ html: '<strong>Total</strong>' }, { html: '' }, { html: '' },
                 { html: '<strong>' + money(fin.charged) + '</strong>', cls: 'num right' },
                 { html: '<strong>' + money(fin.paid) + '</strong>', cls: 'num right' },
                 { html: '<strong>' + money(fin.outstanding) + '</strong>', cls: 'num right' }, { html: '' }]
        }), { title: 'Charges', subtitle: 'Due dates and outstanding balance' })}</div>

        ${card(table({
          head: ['Method', 'Details', 'Clearing time'],
          rows: Finance.options.map((o) => [`<strong>${esc(o.name)}</strong>`, `<span class="text-muted text-small">${esc(o.detail)}</span>`, esc(o.clearing)])
        }), { title: 'Payment options', subtitle: 'Always quote your student ID as the reference' })}`;
    }
  };

  const history = {
    title: 'Payment History',
    crumb: ['Payments', 'Payment history'],
    render() {
      const rows = Finance.payments.slice().sort((a, b) => b.date.localeCompare(a.date)).map((p) => [
        { html: `<span class="code">${esc(p.id)}</span>` },
        { html: esc(fmtDate(p.date)), cls: 'num nowrap' },
        esc(p.method),
        { html: `<span class="text-small text-muted">${esc(p.against)}</span>` },
        { html: money(p.amount), cls: 'num right' },
        { html: statusBadge(p.status) }
      ]);
      const cleared = Finance.payments.filter((p) => p.status === 'Cleared');
      const byMonth = {};
      cleared.forEach((p) => { const k = p.date.slice(0, 7); byMonth[k] = (byMonth[k] || 0) + p.amount; });
      const cols = Object.keys(byMonth).sort().map((k) => {
        const [y, m] = k.split('-');
        return { label: MONTHS[+m - 1] + ' ' + y.slice(2), value: byMonth[k], tip: `${MONTHS[+m - 1]} ${y} · ${money(byMonth[k])}` };
      });

      return tabs(PAY_TABS, '#/payments/history') + pageHead({
        kicker: 'Payments', title: 'Payment history',
        lead: 'Every transaction recorded against your account, newest first.'
      }) + `
        <div class="grid grid-3" style="margin-bottom:var(--space-4)">
          ${statTile({ label: 'Transactions', value: String(Finance.payments.length), foot: `${cleared.length} cleared` })}
          ${statTile({ label: 'Total paid', value: money(cleared.reduce((s, p) => s + p.amount, 0)), foot: 'Cleared payments only' })}
          ${statTile({ label: 'Awaiting clearance', value: money(Finance.payments.filter((p) => p.status === 'Pending').reduce((s, p) => s + p.amount, 0)), foot: 'Usually 1 business day' })}
        </div>
        <div style="margin-bottom:var(--space-4)">${card(
          `<p class="chart-title">Cleared payments by month.</p>` +
          Chart.columns({ data: cols, format: (v) => '$' + Math.round(v), aria: 'Cleared payments by month' }),
          { title: 'Payments over time' })}</div>
        ${card(table({ head: ['Receipt', 'Date', 'Method', 'Applied to', { label: 'Amount', right: true }, 'Status'], rows }),
          { title: 'Transactions', subtitle: 'The table view of the chart above' })}`;
    }
  };

  const receipts = {
    title: 'Receipts',
    crumb: ['Payments', 'Receipts'],
    render(ctx) {
      const selected = Finance.payments.find((p) => p.id === ctx.query.receipt) || Finance.payments[Finance.payments.length - 1];
      const rows = Finance.payments.slice().reverse().map((p) => [
        { html: `<a class="code" href="#/payments/receipts?receipt=${p.id}">${esc(p.id)}</a>` },
        { html: esc(fmtDate(p.date)), cls: 'num nowrap' },
        { html: money(p.amount), cls: 'num right' },
        { html: statusBadge(p.status) },
        { html: `<a class="btn btn-ghost btn-sm" href="#/payments/receipts?receipt=${p.id}">View</a>`, cls: 'right' }
      ]);

      return tabs(PAY_TABS, '#/payments/receipts') + pageHead({
        kicker: 'Payments', title: 'Receipts',
        lead: 'Downloadable proof of payment for every cleared transaction.'
      }) + `
        <div class="grid grid-sidebar">
          <div>${card(table({ head: ['Receipt', 'Date', { label: 'Amount', right: true }, 'Status', ''], rows }),
            { title: 'All receipts', subtitle: `${Finance.payments.length} issued` })}</div>
          <div>${card(`
            <dl class="kv">
              <dt>Receipt no.</dt><dd class="code num">${esc(selected.id)}</dd>
              <dt>Paid by</dt><dd>${esc(Student.name)}</dd>
              <dt>Student ID</dt><dd class="num">${esc(Student.id)}</dd>
              <dt>Date</dt><dd class="num">${esc(fmtDate(selected.date))}</dd>
              <dt>Method</dt><dd>${esc(selected.method)}</dd>
              <dt>Applied to</dt><dd class="text-small">${esc(selected.against)}</dd>
              <dt>Amount</dt><dd class="num"><strong>${money(selected.amount)}</strong></dd>
              <dt>Status</dt><dd>${statusBadge(selected.status)}</dd>
            </dl>
            <hr class="hr">
            <p class="text-small text-muted">This receipt is issued by the Bursary of ${esc(Student.faculty)} and is valid without signature. Retain it for scholarship and tax purposes.</p>
            <div class="page-actions"><button class="btn btn-primary" type="button" data-print>${icon('download', 14)} Print receipt</button></div>
          `, { title: 'Proof of payment', subtitle: selected.id })}</div>
        </div>`;
    },
    mount(root) {
      const b = root.querySelector('[data-print]');
      if (b) b.addEventListener('click', () => window.print());
    }
  };

  const scholarships = {
    title: 'Scholarships',
    crumb: ['Payments', 'Scholarships'],
    render() {
      const cum = cumulativeGPA();
      const cards = Finance.scholarships.map((s) => card(`
        <dl class="kv">
          <dt>Type</dt><dd>${esc(s.kind)}</dd>
          <dt>Value</dt><dd><strong>${esc(s.value)}</strong></dd>
          <dt>Period</dt><dd>${esc(s.period)}</dd>
          <dt>Status</dt><dd>${statusBadge(s.status)}</dd>
        </dl>
        <p class="card-note">${esc(s.note)}</p>`, { title: s.name })).join('');

      return tabs(PAY_TABS, '#/payments/scholarships') + pageHead({
        kicker: 'Payments', title: 'Scholarships & financial aid',
        lead: 'Awards held, applications in flight, and the conditions attached to each.'
      }) + `
        <div style="margin-bottom:var(--space-4)">${card(`
          <div class="grid grid-2">
            <div>
              <span class="stat-label">Cumulative GPA</span>
              <div class="hero-figure num">${cum.gpa.toFixed(2)}</div>
              <p class="text-small text-muted" style="margin-top:var(--space-2)">Renewal floor for the Merit Scholarship is <strong>3.40</strong>.</p>
            </div>
            <div>
              <span class="stat-label">Headroom above the floor</span>
              ${Chart.meter(Math.min(100, ((cum.gpa - 3.4) / 0.6) * 100 + 50), {
                valueLabel: (cum.gpa - 3.4 >= 0 ? '+' : '') + (cum.gpa - 3.4).toFixed(2),
                ariaLabel: 'GPA headroom above the scholarship renewal floor'
              })}
              <p class="text-small text-muted" style="margin-top:var(--space-2)">${cum.gpa >= 3.4
                ? 'You are above the renewal threshold. The award renews automatically at the end of the academic year.'
                : 'You are below the renewal threshold. Contact Student Services about an appeal.'}</p>
            </div>
          </div>`, { title: 'Renewal condition', subtitle: 'Checked at the end of each academic year' })}</div>
        <div class="grid grid-3">${cards}</div>`;
    }
  };

  /* ── Reports ───────────────────────────────────────────────────────────── */
  const REPORT_TABS = [
    { label: 'Academic',   href: '#/reports/academic' },
    { label: 'Attendance', href: '#/reports/attendance' },
    { label: 'Financial',  href: '#/reports/financial' }
  ];

  const reportAcademic = {
    title: 'Academic Reports',
    crumb: ['Reports', 'Academic'],
    render() {
      const hist = termHistory();
      const cum = cumulativeGPA();
      const creditsByTerm = hist.map((t) => ({ label: t.short, value: t.credits, tip: `${t.label} · ${t.credits} credits` }));

      return tabs(REPORT_TABS, '#/reports/academic') + pageHead({
        kicker: 'Reports', title: 'Academic reports',
        lead: 'Performance trends and credit accumulation across your whole programme.',
        actions: `<button class="btn btn-secondary" type="button" data-print>${icon('download', 14)} Print report</button>`
      }) + `
        <div class="grid grid-4" style="margin-bottom:var(--space-4)">
          ${statTile({ label: 'Cumulative GPA', value: cum.gpa.toFixed(2), foot: 'All completed terms' })}
          ${statTile({ label: 'Credits earned', value: String(cum.credits), foot: 'Of 120 required' })}
          ${statTile({ label: 'Programme progress', value: Math.round((cum.credits / 120) * 100) + '%', foot: `${120 - cum.credits} credits remaining` })}
          ${statTile({ label: 'Terms completed', value: String(hist.length), foot: 'Of 8 in the programme' })}
        </div>
        <div style="margin-bottom:var(--space-4)">${card(
          `<p class="chart-title">Term GPA, oldest term first.</p>` +
          Chart.line({ data: hist.map((t) => ({ label: t.short, value: t.gpa, tip: `${t.label} · ${t.gpa.toFixed(2)}` })), yMin: 2, yMax: 4, format: (v) => v.toFixed(1), aria: 'Term GPA trend' }),
          { title: 'Performance trend' })}</div>
        <div class="grid grid-2">
          ${card(`<p class="chart-title">Credits carried each term.</p>` +
            Chart.columns({ data: creditsByTerm, format: (v) => String(Math.round(v)), height: 190, aria: 'Credits per term' }),
            { title: 'Credit summary' })}
          ${card(table({
            head: ['Term', { label: 'GPA', right: true }, { label: 'Credits', right: true }, { label: 'Running total', right: true }],
            rows: hist.map((t, i) => [
              esc(t.label),
              { html: t.gpa.toFixed(2), cls: 'num right' },
              { html: String(t.credits), cls: 'num right' },
              { html: String(hist.slice(0, i + 1).reduce((s, x) => s + x.credits, 0)), cls: 'num right' }
            ])
          }), { title: 'Term detail', subtitle: 'The table view of both charts' })}
        </div>`;
    },
    mount(root) {
      const b = root.querySelector('[data-print]');
      if (b) b.addEventListener('click', () => window.print());
    }
  };

  const reportAttendance = {
    title: 'Attendance Reports',
    crumb: ['Reports', 'Attendance'],
    render() {
      const rows = ALL_SEMESTERS.map((sem) => {
        const rate = semesterAttendance(sem);
        const held = sem.courses.reduce((s, c) => s + c.attendance.held, 0);
        const absent = sem.courses.reduce((s, c) => s + c.attendance.absent, 0);
        return [
          esc(sem.label + ' · ' + sem.year),
          { html: statusBadge(sem.status) },
          { html: String(held), cls: 'num right' },
          { html: String(absent), cls: 'num right' },
          { html: Chart.meter(rate * 100, { state: rate < ATTENDANCE_THRESHOLD ? 'critical' : rate < 0.9 ? 'warning' : '', valueLabel: pct1(rate * 100), markAt: ATTENDANCE_THRESHOLD * 100, ariaLabel: `${sem.label} attendance` }) },
          { html: attendanceBadge(rate) }
        ];
      });

      const perCourse = ALL_SEMESTERS.flatMap((sem) => sem.courses.map((c) => ({
        label: c.code, value: attendanceRate(c) * 100,
        tip: `${c.code} · ${sem.label} · ${pct1(attendanceRate(c) * 100)}`
      })));

      return tabs(REPORT_TABS, '#/reports/attendance') + pageHead({
        kicker: 'Reports', title: 'Attendance reports',
        lead: 'Term summaries and a course-by-course comparison across the whole academic year.'
      }) + `
        <div style="margin-bottom:var(--space-4)">${card(table({
          head: ['Term', 'Status', { label: 'Sessions', right: true }, { label: 'Absences', right: true }, 'Rate', 'Standing'], rows
        }), { title: 'Term attendance summary' })}</div>
        ${card(`<p class="chart-title">Every course this academic year — the dashed line marks the ${ATTENDANCE_THRESHOLD * 100}% requirement.</p>` +
          Chart.bars({ data: perCourse, max: 100, threshold: ATTENDANCE_THRESHOLD * 100, thresholdLabel: `${ATTENDANCE_THRESHOLD * 100}% required`, aria: 'Attendance by course across the year' }) +
          `<div class="legend"><span class="legend-item"><span class="legend-swatch"></span>Attendance rate</span><span class="legend-item"><span class="legend-swatch is-dashed"></span>Minimum required</span></div>`,
          { title: 'By course', subtitle: 'Both semesters' })}`;
    }
  };

  const reportFinancial = {
    title: 'Financial Reports',
    crumb: ['Reports', 'Financial'],
    render() {
      const fin = financeSummary();
      const byTerm = {};
      fin.ledger.forEach((c) => {
        byTerm[c.term] = byTerm[c.term] || { charged: 0, paid: 0 };
        byTerm[c.term].charged += c.amount;
        byTerm[c.term].paid += c.paid;
      });

      return tabs(REPORT_TABS, '#/reports/financial') + pageHead({
        kicker: 'Reports', title: 'Financial reports',
        lead: 'A statement of account for the current academic year.',
        actions: `<button class="btn btn-secondary" type="button" data-print>${icon('download', 14)} Print statement</button>`
      }) + `
        <div class="grid grid-3" style="margin-bottom:var(--space-4)">
          ${statTile({ label: 'Charged', value: money(fin.charged), foot: ACADEMIC_YEARS[0].label })}
          ${statTile({ label: 'Settled', value: money(fin.paid), foot: `${((fin.paid / fin.charged) * 100).toFixed(0)}% of total` })}
          ${statTile({ label: 'Outstanding', value: money(fin.outstanding), foot: fin.nextDue ? `Next due ${fmtDate(fin.nextDue.due)}` : 'Clear' })}
        </div>
        <div style="margin-bottom:var(--space-4)">${card(table({
          head: ['Term', { label: 'Charged', right: true }, { label: 'Settled', right: true }, { label: 'Outstanding', right: true }, 'Settled share'],
          rows: Object.entries(byTerm).map(([term, v]) => [
            esc(term),
            { html: money(v.charged), cls: 'num right' },
            { html: money(v.paid), cls: 'num right' },
            { html: money(v.charged - v.paid), cls: 'num right' },
            { html: Chart.meter((v.paid / v.charged) * 100, { valueLabel: ((v.paid / v.charged) * 100).toFixed(0) + '%', ariaLabel: `${term} settled share` }) }
          ]),
          foot: [{ html: '<strong>Total</strong>' },
                 { html: '<strong>' + money(fin.charged) + '</strong>', cls: 'num right' },
                 { html: '<strong>' + money(fin.paid) + '</strong>', cls: 'num right' },
                 { html: '<strong>' + money(fin.outstanding) + '</strong>', cls: 'num right' }, { html: '' }]
        }), { title: 'Statement of account', subtitle: 'By term' })}</div>
        ${card(table({
          head: ['Date', 'Reference', 'Description', { label: 'Charge', right: true }, { label: 'Credit', right: true }],
          rows: [
            ...fin.ledger.map((c) => ({ date: c.due, ref: c.id, desc: c.desc, charge: c.amount, credit: null })),
            ...Finance.payments.filter((p) => p.status === 'Cleared').map((p) => ({ date: p.date, ref: p.id, desc: 'Payment — ' + p.method, charge: null, credit: p.amount }))
          ].sort((a, b) => a.date.localeCompare(b.date)).map((e) => [
            { html: esc(fmtDate(e.date)), cls: 'num nowrap' },
            { html: `<span class="code">${esc(e.ref)}</span>` },
            esc(e.desc),
            { html: e.charge === null ? '' : money(e.charge), cls: 'num right' },
            { html: e.credit === null ? '' : money(e.credit), cls: 'num right' }
          ])
        }), { title: 'Ledger', subtitle: 'Charges and credits in date order' })}`;
    },
    mount(root) {
      const b = root.querySelector('[data-print]');
      if (b) b.addEventListener('click', () => window.print());
    }
  };

  /* ── Student Services ──────────────────────────────────────────────────── */
  const services = {
    title: 'Student Services',
    crumb: ['Student Services'],
    render() {
      return pageHead({
        kicker: 'Student Services', title: 'Student services',
        lead: 'Certificates, card renewals, library access and advising — request here and track progress below.'
      }) + `
        <div class="grid grid-3" style="margin-bottom:var(--space-4)">
          ${Services.map((s) => card(`
            <p class="text-small text-muted" style="min-height:44px">${esc(s.desc)}</p>
            <dl class="kv">
              <dt>Turnaround</dt><dd>${esc(s.turnaround)}</dd>
              <dt>Fee</dt><dd>${esc(s.fee)}</dd>
            </dl>
            <div class="page-actions" style="margin-top:var(--space-3)">
              <button class="btn btn-secondary btn-sm" type="button" data-request>${esc(s.action)}</button>
            </div>`, { title: s.name })).join('')}
        </div>
        ${card(table({
          head: ['Reference', 'Service', 'Submitted', 'Status'],
          rows: ServiceRequests.map((r) => [
            { html: `<span class="code">${esc(r.id)}</span>` },
            esc(r.service),
            { html: esc(fmtDate(r.submitted)), cls: 'num nowrap' },
            { html: statusBadge(r.status) }
          ])
        }), { title: 'Your requests', subtitle: `${ServiceRequests.length} on file` })}`;
    },
    mount(root) {
      root.querySelectorAll('[data-request]').forEach((b) =>
        b.addEventListener('click', () => { b.textContent = '✓ Submitted'; b.disabled = true; }));
    }
  };

  /* ── Learning Management ───────────────────────────────────────────────── */
  const lms = {
    title: 'Learning Management',
    crumb: ['Learning Management'],
    render() {
      const open = LMS.assignments.filter((a) => a.status !== 'Submitted');
      return pageHead({
        kicker: 'Learning Management', title: 'LMS & classroom',
        lead: 'Assignments mirrored from the learning management system. Submissions themselves happen in the LMS.',
        actions: `<a class="btn btn-primary" href="${LMS.url}" target="_blank" rel="noopener">${icon('external-link', 14)} Open the LMS</a>`
      }) + `
        <div class="grid grid-3" style="margin-bottom:var(--space-4)">
          ${statTile({ label: 'Open assignments', value: String(open.length), foot: `Of ${LMS.assignments.length} this term` })}
          ${statTile({ label: 'Submitted', value: String(LMS.assignments.length - open.length), foot: 'Marked complete in the LMS' })}
          ${statTile({ label: 'Last synchronised', value: LMS.lastSync.split(' ')[1], foot: esc(LMS.lastSync.split(' ')[0]) })}
        </div>
        ${card(table({
          head: ['Course', 'Assignment', 'Due', { label: 'In', right: true }, 'Status'],
          rows: LMS.assignments.map((a) => {
            const d = daysFrom(a.due);
            return [
              { html: `<span class="code">${esc(a.course)}</span>` },
              esc(a.title),
              { html: esc(fmtDate(a.due)), cls: 'num nowrap' },
              { html: d >= 0 ? `${d} days` : 'overdue', cls: 'num right' },
              { html: statusBadge(a.status) }
            ];
          })
        }), { title: 'Assignments', subtitle: 'Mirrored from ' + LMS.url })}`;
    }
  };

  /* ── Communication ─────────────────────────────────────────────────────── */
  const communication = {
    title: 'Communication',
    crumb: ['Communication'],
    render(ctx) {
      const selected = Messages.find((m) => m.subject === ctx.query.msg) || Messages[0];
      return pageHead({
        kicker: 'Communication', title: 'Announcements & messages',
        lead: 'Registry announcements and direct correspondence with teaching staff.'
      }) + `
        <div class="grid grid-sidebar" style="margin-bottom:var(--space-4)">
          <div>${card(`<div class="rows">${Messages.map((m) => `
            <div class="row-item${m.unread ? ' is-unread' : ''}">
              <div class="when">${esc(fmtDateShort(m.date))}</div>
              <div class="what">
                <h5><a href="#/communication?msg=${encodeURIComponent(m.subject)}">${esc(m.subject)}</a></h5>
                <p>${esc(m.from)} · ${esc(m.role)}</p>
              </div>
            </div>`).join('')}</div>`,
            { title: 'Messages with faculty', subtitle: `${Messages.filter((m) => m.unread).length} unread` })}</div>
          <div>${card(`
            <dl class="kv">
              <dt>From</dt><dd><strong>${esc(selected.from)}</strong></dd>
              <dt>Course</dt><dd>${esc(selected.role)}</dd>
              <dt>Date</dt><dd class="num">${esc(fmtDate(selected.date))}</dd>
            </dl>
            <hr class="hr">
            <p>${esc(selected.body)}</p>
            <div class="field" style="margin-top:var(--space-4)">
              <label for="reply">Reply</label>
              <textarea class="input" id="reply" rows="3" placeholder="Write a reply…"></textarea>
            </div>
            <div class="page-actions" style="margin-top:var(--space-2)">
              <button class="btn btn-primary btn-sm" type="button" data-send>Send reply</button>
            </div>`, { title: selected.subject })}</div>
        </div>
        ${card(`<div class="rows">${Announcements.map((a) => `
          <div class="row-item">
            <div class="when">${esc(fmtDateShort(a.date))}</div>
            <div class="what"><h5>${esc(a.title)}</h5><p>${esc(a.body)}</p>
              <p class="text-xs text-dim" style="margin-top:4px">${esc(a.from)}</p></div>
          </div>`).join('')}</div>`, { title: 'Announcements', subtitle: `${Announcements.length} published` })}`;
    },
    mount(root) {
      const b = root.querySelector('[data-send]');
      if (b) b.addEventListener('click', () => {
        const ta = root.querySelector('#reply');
        if (ta && ta.value.trim()) { b.textContent = '✓ Reply sent'; b.disabled = true; ta.disabled = true; }
        else if (ta) ta.focus();
      });
    }
  };

  /* ── Site map (the original mind map, now a page) ──────────────────────── */
  const sitemap = {
    title: 'Site Map',
    crumb: ['Site Map'],
    render() {
      return pageHead({
        kicker: 'Reference', title: 'Portal site map',
        lead: 'The structure this portal implements. Every branch below corresponds to a page in the navigation.'
      }) + card(UI.tree(SITE_MAP) +
        `<p class="card-note">Click any branch to collapse it. The tree renders recursively, so it takes any depth added to the data.</p>`,
        { title: 'Student portal structure', subtitle: `${SITE_MAP.length} top-level areas` });
    },
    mount(root) { UI.attachTree(root); }
  };

  return {
    'dashboard': dashboard,
    'payments/fees': fees,
    'payments/history': history,
    'payments/receipts': receipts,
    'payments/scholarships': scholarships,
    'reports/academic': reportAcademic,
    'reports/attendance': reportAttendance,
    'reports/financial': reportFinancial,
    'services': services,
    'lms': lms,
    'communication': communication,
    'sitemap': sitemap
  };
})();
