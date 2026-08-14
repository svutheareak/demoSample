/* ═══════════════════════════════════════════════════════════════════════════
   app.js — navigation, hash router and boot.

   Classic scripts, no modules and no fetch(), so the portal runs straight from
   the file system (double-click index.html) as well as from a web server.
   ═══════════════════════════════════════════════════════════════════════════ */

/* The structure the portal implements — drives both the sidebar and the
   Site Map page, so the two can never drift apart. */
const SITE_MAP = [
  { label: 'Dashboard', iconKey: 'dashboard', bullets: ['Overview & Quick Widgets'], kids: [] },
  { label: 'Academic Records', iconKey: 'book-open', bullets: [], kids: [
    { label: 'Academic Year', iconKey: 'layers', bullets: [], kids: [
      { label: 'Semester 1', iconKey: 'calendar', bullets: [], kids: [
        { label: 'Courses', iconKey: 'book', bullets: ['Syllabus', 'Lecturers', 'Materials'], kids: [] },
        { label: 'Attendance', iconKey: 'clipboard-check', bullets: ['Overall %', 'Absence Log'], kids: [] },
        { label: 'Grades', iconKey: 'award', bullets: ['Assignments', 'Quizzes', 'Projects'], kids: [] },
        { label: 'Exams', iconKey: 'file-text', bullets: ['Schedules', 'Hall Tickets', 'Final Marks'], kids: [] }
      ]},
      { label: 'Semester 2', iconKey: 'calendar', bullets: [], kids: [
        { label: 'Courses', iconKey: 'book', bullets: ['Syllabus', 'Lecturers', 'Materials'], kids: [] },
        { label: 'Attendance', iconKey: 'clipboard-check', bullets: ['Overall %', 'Absence Log'], kids: [] },
        { label: 'Grades', iconKey: 'award', bullets: ['Assignments', 'Quizzes', 'Projects'], kids: [] },
        { label: 'Exams', iconKey: 'file-text', bullets: ['Schedules', 'Hall Tickets', 'Final Marks'], kids: [] }
      ]}
    ]},
    { label: 'GPA', iconKey: 'trending-up', bullets: ['Cumulative GPA', 'Term GPA Analytics', 'What-If Simulator'], kids: [] },
    { label: 'Transcript', iconKey: 'file-text', bullets: ['Official/Unofficial Request', 'PDF Download', 'Verification'], kids: [] },
    { label: 'Academic Calendar', iconKey: 'calendar', bullets: ['Key Dates', 'Exam Weeks', 'Holidays'], kids: [] }
  ]},
  { label: 'Payments', iconKey: 'credit-card', bullets: [], kids: [
    { label: 'Tuition Fees', iconKey: 'receipt', bullets: ['Due Dates', 'Outstanding Balance', 'Payment Options'], kids: [] },
    { label: 'Payment History', iconKey: 'clock', bullets: ['Transaction Logs', 'Status'], kids: [] },
    { label: 'Receipts', iconKey: 'receipt', bullets: ['Downloadable Proof of Payment'], kids: [] },
    { label: 'Scholarships', iconKey: 'gift', bullets: ['Grants', 'Financial Aid Status'], kids: [] }
  ]},
  { label: 'Reports', iconKey: 'bar-chart', bullets: [], kids: [
    { label: 'Academic Reports', iconKey: 'trending-up', bullets: ['Performance Trends', 'Credit Summary'], kids: [] },
    { label: 'Attendance Reports', iconKey: 'clipboard-list', bullets: ['Term Attendance Summary'], kids: [] },
    { label: 'Financial Reports', iconKey: 'pie-chart', bullets: ['Statement of Account'], kids: [] }
  ]},
  { label: 'Student Services', iconKey: 'wrench', bullets: ['Certificates', 'ID Renewal', 'Library Pass', 'Advising'], kids: [] },
  { label: 'Learning Management', iconKey: 'monitor', bullets: ['LMS / Classroom Link', 'LMS Assignments'], kids: [] },
  { label: 'Communication', iconKey: 'message-circle', bullets: ['Announcements', 'Messages with Faculty'], kids: [] }
];

/* Sidebar — grouped exactly like the site map. */
const NAV = [
  { group: null, items: [
    { label: 'Dashboard', href: '#/dashboard', icon: 'dashboard' }
  ]},
  { group: 'Academic Records', items: [
    { label: 'Overview', href: '#/records', icon: 'book-open' },
    { label: 'Courses', href: '#/records/courses', icon: 'book' },
    { label: 'Attendance', href: '#/records/attendance', icon: 'clipboard-check' },
    { label: 'Grades', href: '#/records/grades', icon: 'award' },
    { label: 'Exams', href: '#/records/exams', icon: 'file-text' },
    { label: 'GPA', href: '#/records/gpa', icon: 'trending-up' },
    { label: 'Transcript', href: '#/records/transcript', icon: 'file-text' },
    { label: 'Academic Calendar', href: '#/records/calendar', icon: 'calendar' }
  ]},
  { group: 'Payments', items: [
    { label: 'Tuition Fees', href: '#/payments/fees', icon: 'credit-card' },
    { label: 'Payment History', href: '#/payments/history', icon: 'clock' },
    { label: 'Receipts', href: '#/payments/receipts', icon: 'receipt' },
    { label: 'Scholarships', href: '#/payments/scholarships', icon: 'gift' }
  ]},
  { group: 'Reports', items: [
    { label: 'Academic', href: '#/reports/academic', icon: 'trending-up' },
    { label: 'Attendance', href: '#/reports/attendance', icon: 'clipboard-list' },
    { label: 'Financial', href: '#/reports/financial', icon: 'pie-chart' }
  ]},
  { group: 'Services & more', items: [
    { label: 'Student Services', href: '#/services', icon: 'wrench' },
    { label: 'Learning Management', href: '#/lms', icon: 'monitor' },
    { label: 'Communication', href: '#/communication', icon: 'message-circle', badge: () => Messages.filter((m) => m.unread).length },
    { label: 'Site Map', href: '#/sitemap', icon: 'map' }
  ]}
];

const ROUTES = Object.assign({}, RecordViews, MoreViews);

const App = (() => {
  let currentSemId = SEMESTER_2.id;

  const el = (id) => document.getElementById(id);

  function parseHash() {
    const raw = (location.hash || '#/dashboard').slice(1);       // "/records/grades?course=CS330"
    const [pathPart, queryPart] = raw.split('?');
    const path = pathPart.replace(/^\/+|\/+$/g, '') || 'dashboard';
    const query = {};
    if (queryPart) {
      for (const pair of queryPart.split('&')) {
        const [k, v] = pair.split('=');
        if (k) query[decodeURIComponent(k)] = decodeURIComponent(v || '');
      }
    }
    return { path, query, href: '#/' + path };
  }

  function renderNav() {
    el('nav').innerHTML = NAV.map((group) => `
      <div class="nav-group">
        ${group.group ? `<div class="nav-group-label">${group.group}</div>` : ''}
        ${group.items.map((it) => {
          const n = typeof it.badge === 'function' ? it.badge() : 0;
          return `<a class="nav-link" href="${it.href}" data-nav="${it.href}">
            <span class="ico">${UI.icon(it.icon, 16)}</span>${it.label}
            ${n ? `<span class="nav-badge">${n}</span>` : ''}
          </a>`;
        }).join('')}
      </div>`).join('');
  }

  function markActive(href) {
    document.querySelectorAll('[data-nav]').forEach((a) => {
      if (a.dataset.nav === href) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  function render() {
    const { path, query, href } = parseHash();
    const view = ROUTES[path] || ROUTES['dashboard'];
    const ctx = { sem: semesterById(currentSemId), query, path };

    const root = el('view');
    root.innerHTML = view.render(ctx);

    // Chrome
    document.title = view.title + ' — Academic Portal';
    el('crumbs').innerHTML = ['Portal', ...view.crumb].map((c, i, arr) =>
      i === arr.length - 1 ? `<span class="here">${c}</span>` : `<span>${c}</span><span class="sep">/</span>`
    ).join('');
    markActive(ROUTES[path] ? href : '#/dashboard');

    // Behaviour. The semester picker is rendered by the view that owns it
    // (the four semester-scoped Academic Records pages), but the selection
    // itself lives here so it survives navigation between them.
    const termSel = root.querySelector('[data-term-select]');
    if (termSel) termSel.addEventListener('change', (e) => {
      currentSemId = e.target.value;
      render();
    });

    Chart.attachTips(root);
    if (view.mount) view.mount(root, ctx);

    document.querySelector('.app').classList.remove('nav-open');
    window.scrollTo(0, 0);
  }

  function boot() {
    renderNav();

    // Semester shortcuts from the Academic Records overview.
    document.addEventListener('click', (e) => {
      const pick = e.target.closest('[data-select-sem]');
      if (pick) { currentSemId = pick.dataset.selectSem; }
    });

    el('sidebar-toggle').addEventListener('click', () =>
      document.querySelector('.app').classList.toggle('nav-open'));

    window.addEventListener('hashchange', render);
    if (!location.hash) location.hash = '#/dashboard';
    render();
  }

  return { boot };
})();

document.addEventListener('DOMContentLoaded', App.boot);
