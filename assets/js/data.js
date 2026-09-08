/* ═══════════════════════════════════════════════════════════════════════════
   data.js — the portal's single source of truth.

   Everything downstream (GPA, attendance %, weighted grades, balances) is
   DERIVED from these records by the helpers at the bottom of this file. No
   computed figure is stored twice, so the numbers can never disagree.
   ═══════════════════════════════════════════════════════════════════════════ */

const Student = {
  name: 'Sam Vutheareak',
  id: 'BIT-2023-0417',
  program: 'BSc Information Technology',
  faculty: 'Faculty of Science & Technology',
  year: 3,
  advisor: 'Dr. Chan Sophea',
  email: 'svutheareak@student.edu.kh',
  enrolled: '2023-10-02',
  standing: 'Good standing'
};

/* Assessment weighting — one scheme, applied to every course. */
const WEIGHTS = { Assignment: 0.20, Quiz: 0.15, Project: 0.20, Midterm: 0.20, Final: 0.25 };

/* 4.0 scale. First matching band wins, so order matters. */
const GRADE_SCALE = [
  { min: 90, letter: 'A',  points: 4.0 },
  { min: 85, letter: 'A-', points: 3.7 },
  { min: 80, letter: 'B+', points: 3.3 },
  { min: 75, letter: 'B',  points: 3.0 },
  { min: 70, letter: 'B-', points: 2.7 },
  { min: 65, letter: 'C+', points: 2.3 },
  { min: 60, letter: 'C',  points: 2.0 },
  { min: 50, letter: 'D',  points: 1.0 },
  { min: 0,  letter: 'F',  points: 0.0 }
];

/* Attendance below this fraction bars a student from the final exam. */
const ATTENDANCE_THRESHOLD = 0.75;

/* ── Current academic year ─────────────────────────────────────────────────
   Two semesters. Semester 1 is closed; Semester 2 is in progress, so its
   Midterm/Final rows carry score: null and are excluded from the weighting.  */

const SEMESTER_1 = {
  id: '2025-s1',
  label: 'Semester 1',
  year: '2025–2026',
  status: 'Completed',
  starts: '2025-10-06',
  ends: '2026-02-13',
  courses: [
    {
      code: 'CS301', title: 'Data Structures & Algorithms', credits: 4,
      lecturer: 'Dr. Chan Sophea', schedule: 'Mon / Wed · 08:00–09:30', room: 'B204',
      syllabus: 'Arrays, linked lists, stacks, queues, trees, hashing, graph traversal, sorting and complexity analysis.',
      materials: [
        { name: 'Course outline (PDF)', kind: 'PDF', size: '240 KB' },
        { name: 'Lecture slides — Weeks 1–14', kind: 'Slides', size: '18.4 MB' },
        { name: 'Lab starter code', kind: 'ZIP', size: '1.2 MB' }
      ],
      assessments: [
        { category: 'Assignment', title: 'Lab 1 — Linked lists', due: '2025-10-24', score: 88, max: 100 },
        { category: 'Assignment', title: 'Lab 2 — Binary search trees', due: '2025-11-14', score: 92, max: 100 },
        { category: 'Quiz', title: 'Quiz 1 — Complexity', due: '2025-11-04', score: 17, max: 20 },
        { category: 'Quiz', title: 'Quiz 2 — Hashing', due: '2025-12-09', score: 16, max: 20 },
        { category: 'Project', title: 'Route planner (graphs)', due: '2026-01-16', score: 90, max: 100 },
        { category: 'Midterm', title: 'Midterm examination', due: '2025-12-01', score: 82, max: 100 },
        { category: 'Final', title: 'Final examination', due: '2026-02-04', score: 86, max: 100 }
      ],
      attendance: { held: 28, absent: 2, late: 1, excused: 1,
        log: [
          { date: '2025-11-10', status: 'Absent', note: 'No notice given' },
          { date: '2025-11-26', status: 'Late', note: 'Arrived 14 min late' },
          { date: '2025-12-15', status: 'Excused', note: 'Medical certificate on file' },
          { date: '2026-01-12', status: 'Absent', note: 'No notice given' }
        ] }
    },
    {
      code: 'CS310', title: 'Database Systems', credits: 3,
      lecturer: 'Dr. Lim Sokha', schedule: 'Tue / Thu · 10:00–11:30', room: 'Lab A102',
      syllabus: 'Relational modelling, normalisation, SQL, transactions, indexing and query optimisation.',
      materials: [
        { name: 'Course outline (PDF)', kind: 'PDF', size: '198 KB' },
        { name: 'SQL exercise set', kind: 'PDF', size: '860 KB' },
        { name: 'Sample database dump', kind: 'SQL', size: '4.1 MB' }
      ],
      assessments: [
        { category: 'Assignment', title: 'ER modelling exercise', due: '2025-10-28', score: 84, max: 100 },
        { category: 'Assignment', title: 'Normalisation set', due: '2025-11-25', score: 79, max: 100 },
        { category: 'Quiz', title: 'Quiz 1 — Relational algebra', due: '2025-11-06', score: 15, max: 20 },
        { category: 'Quiz', title: 'Quiz 2 — Joins & subqueries', due: '2025-12-11', score: 18, max: 20 },
        { category: 'Project', title: 'Library schema & queries', due: '2026-01-20', score: 87, max: 100 },
        { category: 'Midterm', title: 'Midterm examination', due: '2025-12-03', score: 76, max: 100 },
        { category: 'Final', title: 'Final examination', due: '2026-02-06', score: 81, max: 100 }
      ],
      attendance: { held: 28, absent: 1, late: 2, excused: 0,
        log: [
          { date: '2025-11-18', status: 'Late', note: 'Arrived 9 min late' },
          { date: '2025-12-04', status: 'Absent', note: 'No notice given' },
          { date: '2026-01-08', status: 'Late', note: 'Arrived 12 min late' }
        ] }
    },
    {
      code: 'CS322', title: 'Computer Networks', credits: 3,
      lecturer: 'Mr. Pich Daravuth', schedule: 'Mon / Fri · 13:30–15:00', room: 'B301',
      syllabus: 'OSI and TCP/IP layering, addressing and subnetting, routing, transport protocols, network security basics.',
      materials: [
        { name: 'Course outline (PDF)', kind: 'PDF', size: '176 KB' },
        { name: 'Packet Tracer labs', kind: 'ZIP', size: '9.6 MB' }
      ],
      assessments: [
        { category: 'Assignment', title: 'Subnetting worksheet', due: '2025-10-31', score: 95, max: 100 },
        { category: 'Assignment', title: 'Routing lab report', due: '2025-12-05', score: 88, max: 100 },
        { category: 'Quiz', title: 'Quiz 1 — Layering', due: '2025-11-07', score: 18, max: 20 },
        { category: 'Quiz', title: 'Quiz 2 — TCP vs UDP', due: '2025-12-12', score: 19, max: 20 },
        { category: 'Project', title: 'Campus network design', due: '2026-01-23', score: 93, max: 100 },
        { category: 'Midterm', title: 'Midterm examination', due: '2025-12-02', score: 88, max: 100 },
        { category: 'Final', title: 'Final examination', due: '2026-02-09', score: 91, max: 100 }
      ],
      attendance: { held: 28, absent: 0, late: 1, excused: 0,
        log: [ { date: '2025-12-19', status: 'Late', note: 'Arrived 6 min late' } ] }
    },
    {
      code: 'MA210', title: 'Discrete Mathematics', credits: 3,
      lecturer: 'Dr. Nou Chanthy', schedule: 'Wed / Fri · 09:45–11:15', room: 'C110',
      syllabus: 'Logic and proof, set theory, combinatorics, recurrence relations, graph theory foundations.',
      materials: [
        { name: 'Course outline (PDF)', kind: 'PDF', size: '154 KB' },
        { name: 'Problem sets 1–10', kind: 'PDF', size: '2.8 MB' }
      ],
      assessments: [
        { category: 'Assignment', title: 'Proof techniques set', due: '2025-10-29', score: 74, max: 100 },
        { category: 'Assignment', title: 'Combinatorics set', due: '2025-11-28', score: 81, max: 100 },
        { category: 'Quiz', title: 'Quiz 1 — Logic', due: '2025-11-05', score: 14, max: 20 },
        { category: 'Quiz', title: 'Quiz 2 — Recurrences', due: '2025-12-10', score: 15, max: 20 },
        { category: 'Project', title: 'Graph colouring report', due: '2026-01-19', score: 78, max: 100 },
        { category: 'Midterm', title: 'Midterm examination', due: '2025-12-04', score: 71, max: 100 },
        { category: 'Final', title: 'Final examination', due: '2026-02-11', score: 77, max: 100 }
      ],
      attendance: { held: 28, absent: 3, late: 0, excused: 1,
        log: [
          { date: '2025-11-12', status: 'Absent', note: 'No notice given' },
          { date: '2025-11-21', status: 'Absent', note: 'No notice given' },
          { date: '2025-12-17', status: 'Excused', note: 'Family bereavement' },
          { date: '2026-01-14', status: 'Absent', note: 'No notice given' }
        ] }
    },
    {
      code: 'EN220', title: 'Technical Writing', credits: 2,
      lecturer: 'Ms. Keo Sreyneang', schedule: 'Thu · 14:00–16:00', room: 'D205',
      syllabus: 'Audience analysis, document structure, technical description, reports and professional correspondence.',
      materials: [
        { name: 'Course outline (PDF)', kind: 'PDF', size: '120 KB' },
        { name: 'Style guide', kind: 'PDF', size: '640 KB' }
      ],
      assessments: [
        { category: 'Assignment', title: 'Technical description', due: '2025-11-06', score: 90, max: 100 },
        { category: 'Assignment', title: 'Instruction manual', due: '2025-12-11', score: 93, max: 100 },
        { category: 'Quiz', title: 'Quiz 1 — Style & tone', due: '2025-11-20', score: 19, max: 20 },
        { category: 'Quiz', title: 'Quiz 2 — Citation', due: '2026-01-08', score: 18, max: 20 },
        { category: 'Project', title: 'Formal report', due: '2026-01-22', score: 91, max: 100 },
        { category: 'Midterm', title: 'Midterm examination', due: '2025-12-05', score: 87, max: 100 },
        { category: 'Final', title: 'Final examination', due: '2026-02-12', score: 89, max: 100 }
      ],
      attendance: { held: 14, absent: 0, late: 0, excused: 1,
        log: [ { date: '2025-12-18', status: 'Excused', note: 'Faculty event — approved' } ] }
    }
  ],
  exams: [
    { code: 'CS301', title: 'Data Structures & Algorithms', date: '2026-02-04', time: '08:00–10:00', room: 'Hall A', seat: 'A-042', ticket: 'Issued', mark: 86 },
    { code: 'CS310', title: 'Database Systems',            date: '2026-02-06', time: '08:00–10:00', room: 'Hall A', seat: 'A-042', ticket: 'Issued', mark: 81 },
    { code: 'CS322', title: 'Computer Networks',           date: '2026-02-09', time: '13:00–15:00', room: 'Hall B', seat: 'B-118', ticket: 'Issued', mark: 91 },
    { code: 'MA210', title: 'Discrete Mathematics',        date: '2026-02-11', time: '08:00–10:00', room: 'Hall C', seat: 'C-076', ticket: 'Issued', mark: 77 },
    { code: 'EN220', title: 'Technical Writing',           date: '2026-02-12', time: '13:00–15:00', room: 'Hall B', seat: 'B-118', ticket: 'Issued', mark: 89 }
  ]
};

const SEMESTER_2 = {
  id: '2025-s2',
  label: 'Semester 2',
  year: '2025–2026',
  status: 'In progress',
  starts: '2026-03-02',
  ends: '2026-07-10',
  courses: [
    {
      code: 'CS330', title: 'Software Engineering', credits: 4,
      lecturer: 'Dr. Chan Sophea', schedule: 'Mon / Wed · 08:00–09:30', room: 'B204',
      syllabus: 'Requirements engineering, architecture and design patterns, testing strategy, version control and agile delivery.',
      materials: [
        { name: 'Course outline (PDF)', kind: 'PDF', size: '212 KB' },
        { name: 'Design patterns handbook', kind: 'PDF', size: '5.4 MB' },
        { name: 'Team project brief', kind: 'DOCX', size: '88 KB' }
      ],
      assessments: [
        { category: 'Assignment', title: 'Requirements specification', due: '2026-03-20', score: 91, max: 100 },
        { category: 'Assignment', title: 'Architecture decision record', due: '2026-04-17', score: 86, max: 100 },
        { category: 'Quiz', title: 'Quiz 1 — SDLC models', due: '2026-03-27', score: 18, max: 20 },
        { category: 'Quiz', title: 'Quiz 2 — Testing', due: '2026-05-08', score: 17, max: 20 },
        { category: 'Project', title: 'Team build — sprint 1', due: '2026-05-22', score: 89, max: 100 },
        { category: 'Midterm', title: 'Midterm examination', due: '2026-04-24', score: 84, max: 100 },
        { category: 'Final', title: 'Final examination', due: '2026-07-01', score: null, max: 100 }
      ],
      attendance: { held: 22, absent: 1, late: 1, excused: 0,
        log: [
          { date: '2026-04-06', status: 'Late', note: 'Arrived 11 min late' },
          { date: '2026-05-18', status: 'Absent', note: 'No notice given' }
        ] }
    },
    {
      code: 'CS340', title: 'Web Application Development', credits: 4,
      lecturer: 'Mr. Pich Daravuth', schedule: 'Tue / Thu · 08:00–10:00', room: 'Lab A104',
      syllabus: 'Semantic HTML and accessibility, modern CSS layout, JavaScript, HTTP APIs, authentication and deployment.',
      materials: [
        { name: 'Course outline (PDF)', kind: 'PDF', size: '204 KB' },
        { name: 'Lab repository', kind: 'ZIP', size: '3.7 MB' },
        { name: 'Accessibility checklist', kind: 'PDF', size: '310 KB' }
      ],
      assessments: [
        { category: 'Assignment', title: 'Responsive layout build', due: '2026-03-19', score: 96, max: 100 },
        { category: 'Assignment', title: 'Fetch & render an API', due: '2026-04-16', score: 94, max: 100 },
        { category: 'Quiz', title: 'Quiz 1 — Semantic HTML', due: '2026-03-26', score: 20, max: 20 },
        { category: 'Quiz', title: 'Quiz 2 — CSS layout', due: '2026-05-07', score: 19, max: 20 },
        { category: 'Project', title: 'Portal front-end', due: '2026-05-28', score: 95, max: 100 },
        { category: 'Midterm', title: 'Midterm examination', due: '2026-04-23', score: 92, max: 100 },
        { category: 'Final', title: 'Final examination', due: '2026-07-03', score: null, max: 100 }
      ],
      attendance: { held: 22, absent: 0, late: 0, excused: 0, log: [] }
    },
    {
      code: 'CS350', title: 'Operating Systems', credits: 3,
      lecturer: 'Dr. Lim Sokha', schedule: 'Mon / Fri · 10:00–11:30', room: 'B208',
      syllabus: 'Processes and threads, scheduling, synchronisation, memory management, file systems and virtualisation.',
      materials: [
        { name: 'Course outline (PDF)', kind: 'PDF', size: '188 KB' },
        { name: 'xv6 lab guide', kind: 'PDF', size: '2.2 MB' }
      ],
      assessments: [
        { category: 'Assignment', title: 'Scheduling simulation', due: '2026-03-23', score: 78, max: 100 },
        { category: 'Assignment', title: 'Producer–consumer', due: '2026-04-20', score: 72, max: 100 },
        { category: 'Quiz', title: 'Quiz 1 — Processes', due: '2026-03-30', score: 13, max: 20 },
        { category: 'Quiz', title: 'Quiz 2 — Deadlock', due: '2026-05-11', score: 14, max: 20 },
        { category: 'Project', title: 'Shell implementation', due: '2026-06-01', score: 80, max: 100 },
        { category: 'Midterm', title: 'Midterm examination', due: '2026-04-27', score: 69, max: 100 },
        { category: 'Final', title: 'Final examination', due: '2026-07-06', score: null, max: 100 }
      ],
      // Six unexcused absences of 22 sessions → 72.7%, under the 75% bar.
      // This is the record that trips the attendance hold on the CS350 paper.
      attendance: { held: 22, absent: 6, late: 2, excused: 0,
        log: [
          { date: '2026-03-16', status: 'Absent', note: 'No notice given' },
          { date: '2026-04-03', status: 'Late', note: 'Arrived 18 min late' },
          { date: '2026-04-13', status: 'Absent', note: 'No notice given' },
          { date: '2026-05-04', status: 'Absent', note: 'No notice given' },
          { date: '2026-05-15', status: 'Late', note: 'Arrived 8 min late' },
          { date: '2026-06-05', status: 'Absent', note: 'No notice given' },
          { date: '2026-06-12', status: 'Absent', note: 'No notice given' },
          { date: '2026-06-19', status: 'Absent', note: 'Lecturer notified after the session' }
        ] }
    },
    {
      code: 'MA220', title: 'Probability & Statistics', credits: 3,
      lecturer: 'Dr. Nou Chanthy', schedule: 'Wed · 13:30–16:00', room: 'C110',
      syllabus: 'Probability distributions, expectation, sampling, confidence intervals, hypothesis testing and regression.',
      materials: [
        { name: 'Course outline (PDF)', kind: 'PDF', size: '166 KB' },
        { name: 'Statistical tables', kind: 'PDF', size: '420 KB' }
      ],
      assessments: [
        { category: 'Assignment', title: 'Distributions worksheet', due: '2026-03-25', score: 82, max: 100 },
        { category: 'Assignment', title: 'Sampling exercise', due: '2026-04-22', score: 85, max: 100 },
        { category: 'Quiz', title: 'Quiz 1 — Probability rules', due: '2026-04-01', score: 16, max: 20 },
        { category: 'Quiz', title: 'Quiz 2 — Distributions', due: '2026-05-13', score: 15, max: 20 },
        { category: 'Project', title: 'Survey analysis', due: '2026-06-03', score: 84, max: 100 },
        { category: 'Midterm', title: 'Midterm examination', due: '2026-04-29', score: 80, max: 100 },
        { category: 'Final', title: 'Final examination', due: '2026-07-08', score: null, max: 100 }
      ],
      attendance: { held: 11, absent: 1, late: 0, excused: 0,
        log: [ { date: '2026-04-08', status: 'Absent', note: 'No notice given' } ] }
    },
    {
      code: 'BU210', title: 'Project Management', credits: 2,
      lecturer: 'Ms. Sok Chariya', schedule: 'Thu · 13:30–15:30', room: 'D101',
      syllabus: 'Scope and scheduling, estimation, risk registers, stakeholder communication and project closure.',
      materials: [
        { name: 'Course outline (PDF)', kind: 'PDF', size: '142 KB' },
        { name: 'Gantt template', kind: 'XLSX', size: '96 KB' }
      ],
      assessments: [
        { category: 'Assignment', title: 'Work breakdown structure', due: '2026-03-26', score: 88, max: 100 },
        { category: 'Assignment', title: 'Risk register', due: '2026-04-30', score: 90, max: 100 },
        { category: 'Quiz', title: 'Quiz 1 — Estimation', due: '2026-04-09', score: 17, max: 20 },
        { category: 'Quiz', title: 'Quiz 2 — Scheduling', due: '2026-05-21', score: 18, max: 20 },
        { category: 'Project', title: 'Project charter', due: '2026-06-04', score: 92, max: 100 },
        { category: 'Midterm', title: 'Midterm examination', due: '2026-04-30', score: 86, max: 100 },
        { category: 'Final', title: 'Final examination', due: '2026-07-09', score: null, max: 100 }
      ],
      attendance: { held: 11, absent: 0, late: 1, excused: 0,
        log: [ { date: '2026-05-14', status: 'Late', note: 'Arrived 7 min late' } ] }
    }
  ],
  exams: [
    { code: 'CS330', title: 'Software Engineering',        date: '2026-07-01', time: '08:00–10:00', room: 'Hall A', seat: 'A-051', ticket: 'Issued',  mark: null },
    { code: 'CS340', title: 'Web Application Development', date: '2026-07-03', time: '08:00–10:00', room: 'Hall A', seat: 'A-051', ticket: 'Issued',  mark: null },
    { code: 'CS350', title: 'Operating Systems',           date: '2026-07-06', time: '13:00–15:00', room: 'Hall B', seat: 'B-127', ticket: 'Pending', mark: null },
    { code: 'MA220', title: 'Probability & Statistics',    date: '2026-07-08', time: '08:00–10:00', room: 'Hall C', seat: 'C-089', ticket: 'Issued',  mark: null },
    { code: 'BU210', title: 'Project Management',          date: '2026-07-09', time: '13:00–15:00', room: 'Hall B', seat: 'B-127', ticket: 'Issued',  mark: null }
  ]
};

const ACADEMIC_YEARS = [
  { id: '2025-2026', label: '2025–2026', semesters: [SEMESTER_1, SEMESTER_2] }
];

/* ── Completed history (earlier years, summarised for the transcript) ────── */
const PRIOR_TERMS = [
  { id: '2023-s1', year: '2023–2024', label: 'Year 1 · Semester 1', courses: [
    { code: 'CS101', title: 'Introduction to Programming', credits: 4, letter: 'B+' },
    { code: 'CS110', title: 'Computer Fundamentals',       credits: 3, letter: 'A-' },
    { code: 'MA110', title: 'Calculus I',                  credits: 3, letter: 'B'  },
    { code: 'EN110', title: 'English for Academic Purposes', credits: 2, letter: 'B+' },
    { code: 'GS100', title: 'Study Skills',                credits: 2, letter: 'A'  }
  ]},
  { id: '2023-s2', year: '2023–2024', label: 'Year 1 · Semester 2', courses: [
    { code: 'CS120', title: 'Object-Oriented Programming', credits: 4, letter: 'A-' },
    { code: 'CS130', title: 'Web Fundamentals',            credits: 3, letter: 'A'  },
    { code: 'MA120', title: 'Calculus II',                 credits: 3, letter: 'B'  },
    { code: 'PH110', title: 'Physics for Computing',       credits: 3, letter: 'B+' },
    { code: 'EN120', title: 'Communication Skills',        credits: 2, letter: 'A-' }
  ]},
  { id: '2024-s1', year: '2024–2025', label: 'Year 2 · Semester 1', courses: [
    { code: 'CS201', title: 'Data Modelling',              credits: 3, letter: 'A-' },
    { code: 'CS210', title: 'Systems Analysis & Design',   credits: 3, letter: 'B+' },
    { code: 'CS220', title: 'Computer Architecture',       credits: 3, letter: 'B'  },
    { code: 'MA200', title: 'Linear Algebra',              credits: 3, letter: 'A-' },
    { code: 'BU110', title: 'Principles of Management',    credits: 2, letter: 'A'  }
  ]},
  { id: '2024-s2', year: '2024–2025', label: 'Year 2 · Semester 2', courses: [
    { code: 'CS230', title: 'Human–Computer Interaction',  credits: 3, letter: 'A'  },
    { code: 'CS240', title: 'Mobile Development',          credits: 4, letter: 'B+' },
    { code: 'CS250', title: 'Information Security',        credits: 3, letter: 'B'  },
    { code: 'MA210B', title: 'Numerical Methods',          credits: 3, letter: 'B-' },
    { code: 'BU120', title: 'Entrepreneurship',            credits: 2, letter: 'A-' }
  ]}
];

/* ── Finance ───────────────────────────────────────────────────────────────
   Charges and payments are separate ledgers; every balance is their difference. */
const Finance = {
  currency: 'USD',
  charges: [
    { id: 'INV-2025-0431', desc: 'Tuition — Semester 1, 2025–2026', term: 'Semester 1', amount: 1250, due: '2025-10-10' },
    { id: 'INV-2025-0432', desc: 'Laboratory fee — Semester 1',     term: 'Semester 1', amount: 75,   due: '2025-10-10' },
    { id: 'INV-2026-0518', desc: 'Tuition — Semester 2, 2025–2026', term: 'Semester 2', amount: 1250, due: '2026-03-06' },
    { id: 'INV-2026-0519', desc: 'Laboratory fee — Semester 2',     term: 'Semester 2', amount: 75,   due: '2026-03-06' },
    { id: 'INV-2026-0644', desc: 'Library & resource fee',          term: 'Semester 2', amount: 25,   due: '2026-08-28' },
    { id: 'INV-2026-0645', desc: 'Graduation project deposit',      term: 'Semester 2', amount: 120,  due: '2026-09-05' }
  ],
  payments: [
    { id: 'RCP-88214', date: '2025-10-04', method: 'ABA Bank transfer', amount: 1325, against: 'INV-2025-0431, INV-2025-0432', status: 'Cleared' },
    { id: 'RCP-91077', date: '2026-03-02', method: 'ABA Bank transfer', amount: 900,  against: 'INV-2026-0518',                 status: 'Cleared' },
    { id: 'RCP-93310', date: '2026-04-18', method: 'Wing (mobile)',     amount: 350,  against: 'INV-2026-0518',                 status: 'Cleared' },
    { id: 'RCP-95002', date: '2026-06-11', method: 'Cash — Bursary',    amount: 75,   against: 'INV-2026-0519',                 status: 'Cleared' },
    { id: 'RCP-96140', date: '2026-08-09', method: 'ABA Bank transfer', amount: 40,   against: 'INV-2026-0644',                 status: 'Pending' }
  ],
  scholarships: [
    { name: 'Merit Scholarship — Dean\'s List', kind: 'Tuition discount', value: '20% of tuition', period: '2025–2026', status: 'Active',
      note: 'Renewed automatically while cumulative GPA stays at or above 3.40.' },
    { name: 'Faculty Need-Based Grant', kind: 'Cash grant', value: '$300 per year', period: '2026–2027', status: 'Under review',
      note: 'Submitted 2026-07-28. Committee decision expected before term registration.' },
    { name: 'ICT Innovation Award', kind: 'One-off prize', value: '$150', period: '2025–2026', status: 'Awarded',
      note: 'Awarded for the Semester 1 campus network design project.' }
  ],
  options: [
    { name: 'ABA Bank transfer', detail: 'Account 000 452 118 · reference = your student ID', clearing: '1 business day' },
    { name: 'Wing / mobile wallet', detail: 'Biller code 4471 · reference = your student ID', clearing: 'Instant' },
    { name: 'Bursary counter', detail: 'Building D, ground floor · Mon–Fri 08:00–16:00', clearing: 'Immediate' },
    { name: 'Instalment plan', detail: 'Three instalments per semester · apply before week 2', clearing: 'On approval' }
  ]
};

/* ── Calendar, services, LMS, communication ───────────────────────────────── */
const CalendarEvents = [
  { date: '2026-03-02', title: 'Semester 2 begins',                 kind: 'Key date' },
  { date: '2026-03-13', title: 'Add / drop deadline',               kind: 'Deadline' },
  { date: '2026-04-13', title: 'Khmer New Year holiday',            kind: 'Holiday', until: '2026-04-16' },
  { date: '2026-04-20', title: 'Midterm examination week',          kind: 'Exam week', until: '2026-05-01' },
  { date: '2026-05-01', title: 'Labour Day',                        kind: 'Holiday' },
  { date: '2026-06-15', title: 'Project submission deadline',       kind: 'Deadline' },
  { date: '2026-06-22', title: 'Revision week',                     kind: 'Key date', until: '2026-06-26' },
  { date: '2026-06-29', title: 'Final examination week',            kind: 'Exam week', until: '2026-07-10' },
  { date: '2026-07-17', title: 'Semester 2 results published',      kind: 'Key date' },
  { date: '2026-08-24', title: 'Registration opens — 2026–2027',    kind: 'Key date' },
  { date: '2026-09-05', title: 'Graduation project deposit due',    kind: 'Deadline' },
  { date: '2026-10-05', title: 'Academic year 2026–2027 begins',    kind: 'Key date' }
];

const Services = [
  { name: 'Enrolment certificate',   desc: 'Proof of current enrolment for visa, bank or employer use.', turnaround: '2 working days', fee: 'Free',  action: 'Request' },
  { name: 'Student ID renewal',      desc: 'Replace an expired or damaged card. Photo required.',        turnaround: '5 working days', fee: '$5',    action: 'Request' },
  { name: 'Library pass',            desc: 'Extended borrowing and after-hours reading room access.',    turnaround: 'Same day',       fee: 'Free',  action: 'Activate' },
  { name: 'Academic advising',       desc: 'Book a session with your assigned advisor.',                 turnaround: 'By appointment', fee: 'Free',  action: 'Book' },
  { name: 'Letter of recommendation', desc: 'Request from a lecturer who has taught you.',               turnaround: '10 working days', fee: 'Free', action: 'Request' },
  { name: 'Exam seat re-allocation', desc: 'Apply for a different hall on documented grounds.',          turnaround: '3 working days', fee: 'Free',  action: 'Apply' }
];

const ServiceRequests = [
  { id: 'SR-4471', service: 'Enrolment certificate', submitted: '2026-07-30', status: 'Ready for collection' },
  { id: 'SR-4488', service: 'Student ID renewal',    submitted: '2026-08-05', status: 'In progress' },
  { id: 'SR-4390', service: 'Library pass',          submitted: '2026-03-11', status: 'Completed' }
];

const LMS = {
  url: 'https://lms.student.edu.kh',
  lastSync: '2026-08-11 21:40',
  assignments: [
    { course: 'CS330', title: 'Sprint 2 retrospective',     due: '2026-08-14', status: 'Not started' },
    { course: 'CS340', title: 'Accessibility audit report', due: '2026-08-16', status: 'Draft saved' },
    { course: 'CS350', title: 'Virtual memory exercise',    due: '2026-08-18', status: 'Not started' },
    { course: 'MA220', title: 'Regression problem set',     due: '2026-08-21', status: 'Submitted' },
    { course: 'BU210', title: 'Closure report outline',     due: '2026-08-25', status: 'Not started' }
  ]
};

const Announcements = [
  { date: '2026-08-10', from: 'Registrar', title: 'Registration for 2026–2027 opens 24 August',
    body: 'Course selection for the coming academic year opens at 09:00 on 24 August. Clear any outstanding balance before registering — the system blocks enrolment while fees remain unpaid.' },
  { date: '2026-08-07', from: 'Faculty of Science & Technology', title: 'Final results published 17 July',
    body: 'Semester 2 results will be released through the portal. Remark requests close five working days after publication.' },
  { date: '2026-07-29', from: 'Bursary', title: 'Library & resource fee now due',
    body: 'The annual library and resource fee appears on your account. Payment is due by 28 August.' },
  { date: '2026-07-21', from: 'Library', title: 'Extended opening during revision week',
    body: 'The reading room stays open until 22:00 for the duration of revision and examination weeks.' }
];

const Messages = [
  { from: 'Dr. Chan Sophea', role: 'CS330 · Software Engineering', date: '2026-08-09', unread: true,
    subject: 'Sprint 2 retrospective format',
    body: 'Please keep the retrospective to two pages and include the burndown chart from your team board. I will review submissions on Friday.' },
  { from: 'Mr. Pich Daravuth', role: 'CS340 · Web Application Development', date: '2026-08-06', unread: true,
    subject: 'Your portal front-end project',
    body: 'Strong work on the accessibility pass — the keyboard navigation was the best in the cohort. Consider documenting your colour contrast decisions in the report.' },
  { from: 'Dr. Lim Sokha', role: 'CS350 · Operating Systems', date: '2026-07-30', unread: false,
    subject: 'Attendance below threshold',
    body: 'Your attendance in CS350 has fallen close to the 75% requirement. Please see me during office hours to discuss a recovery plan before the final examination.' },
  { from: 'Academic Advising', role: 'Student Services', date: '2026-07-24', unread: false,
    subject: 'Year 4 course planning session',
    body: 'Your advisor has openings on 18 and 19 August for year 4 planning. Book through Student Services.' }
];

/* ═══════════════════════════════════════════════════════════════════════════
   Derivations — every displayed figure comes from here.
   ═══════════════════════════════════════════════════════════════════════════ */

const gradeFor = (pct) => GRADE_SCALE.find((g) => pct >= g.min) || GRADE_SCALE[GRADE_SCALE.length - 1];
const pointsFor = (letter) => (GRADE_SCALE.find((g) => g.letter === letter) || { points: 0 }).points;

/** Category average as a percentage, or null when nothing in it is graded yet. */
function categoryPct(course, category) {
  const rows = course.assessments.filter((a) => a.category === category && a.score !== null);
  if (!rows.length) return null;
  const got = rows.reduce((s, a) => s + a.score, 0);
  const max = rows.reduce((s, a) => s + a.max, 0);
  return (got / max) * 100;
}

/**
 * Weighted course percentage over the categories that have been graded.
 * Ungraded categories are dropped and the remaining weights re-normalised, so
 * an in-progress course reports its standing so far rather than a false low.
 */
function coursePct(course) {
  let weighted = 0, live = 0;
  for (const [category, weight] of Object.entries(WEIGHTS)) {
    const pct = categoryPct(course, category);
    if (pct === null) continue;
    weighted += pct * weight;
    live += weight;
  }
  return live === 0 ? null : { pct: weighted / live, coverage: live };
}

function courseGrade(course) {
  const r = coursePct(course);
  if (!r) return { pct: null, letter: '—', points: null, coverage: 0 };
  const g = gradeFor(r.pct);
  return { pct: r.pct, letter: g.letter, points: g.points, coverage: r.coverage };
}

function attendanceRate(course) {
  const a = course.attendance;
  // Excused absences do not count against the rate; lateness still counts as present.
  const counted = a.held - a.excused;
  const present = counted - a.absent;
  return counted <= 0 ? 1 : present / counted;
}

function semesterAttendance(sem) {
  const held = sem.courses.reduce((s, c) => s + c.attendance.held - c.attendance.excused, 0);
  const absent = sem.courses.reduce((s, c) => s + c.attendance.absent, 0);
  return held <= 0 ? 1 : (held - absent) / held;
}

/** Credit-weighted GPA for one semester of full course records. */
function semesterGPA(sem) {
  let pts = 0, credits = 0;
  for (const c of sem.courses) {
    const g = courseGrade(c);
    if (g.points === null) continue;
    pts += g.points * c.credits;
    credits += c.credits;
  }
  return credits === 0 ? null : { gpa: pts / credits, credits };
}

/** Credit-weighted GPA for a summarised prior term (letters only). */
function priorTermGPA(term) {
  let pts = 0, credits = 0;
  for (const c of term.courses) {
    pts += pointsFor(c.letter) * c.credits;
    credits += c.credits;
  }
  return { gpa: pts / credits, credits };
}

/** Every completed term, oldest first — the series behind the GPA trend. */
function termHistory() {
  const history = PRIOR_TERMS.map((t) => {
    const r = priorTermGPA(t);
    return { id: t.id, label: t.label, short: t.label.replace('Year ', 'Y').replace(' · Semester ', 'S'), gpa: r.gpa, credits: r.credits, status: 'Completed' };
  });
  const s1 = semesterGPA(SEMESTER_1);
  history.push({ id: SEMESTER_1.id, label: 'Year 3 · Semester 1', short: 'Y3S1', gpa: s1.gpa, credits: s1.credits, status: 'Completed' });
  return history;
}

function cumulativeGPA() {
  let pts = 0, credits = 0;
  for (const t of termHistory()) { pts += t.gpa * t.credits; credits += t.credits; }
  return { gpa: pts / credits, credits };
}

/* Finance derivations */
const money = (n) => (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function paidAgainst(chargeId) {
  return Finance.payments
    .filter((p) => p.status === 'Cleared' && p.against.includes(chargeId))
    .reduce((s, p) => s + p.amount, 0);
}

/** Charges carry their own settlement state; a payment split across two invoices
    is applied in charge order so the older invoice clears first. */
function chargeLedger() {
  const remaining = {};
  for (const p of Finance.payments) {
    if (p.status !== 'Cleared') continue;
    remaining[p.id] = p.amount;
  }
  return Finance.charges.map((c) => {
    let applied = 0;
    for (const p of Finance.payments) {
      if (p.status !== 'Cleared' || !p.against.includes(c.id)) continue;
      const take = Math.min(remaining[p.id], c.amount - applied);
      applied += take;
      remaining[p.id] -= take;
      if (applied >= c.amount) break;
    }
    const outstanding = c.amount - applied;
    return { ...c, paid: applied, outstanding,
      state: outstanding <= 0 ? 'Paid' : applied > 0 ? 'Part paid' : 'Unpaid' };
  });
}

function financeSummary() {
  const ledger = chargeLedger();
  const charged = ledger.reduce((s, c) => s + c.amount, 0);
  const paid = ledger.reduce((s, c) => s + c.paid, 0);
  const outstanding = charged - paid;
  const pending = Finance.payments.filter((p) => p.status === 'Pending').reduce((s, p) => s + p.amount, 0);
  const nextDue = ledger.filter((c) => c.outstanding > 0).sort((a, b) => a.due.localeCompare(b.due))[0] || null;
  return { ledger, charged, paid, outstanding, pending, nextDue };
}

/**
 * Spread an amount over the given charges, oldest first — the same order
 * chargeLedger() settles them in, so a payment preview can never promise a
 * split the ledger will not honour. Lives here, beside that function, because
 * the two have to stay in step.
 */
function allocatePayment(charges, amount) {
  let left = amount;
  const out = [];
  for (const c of charges) {
    const take = Math.min(left, c.outstanding);
    if (take <= 0) continue;
    out.push({ id: c.id, desc: c.desc, applied: take });
    left -= take;
  }
  return out;
}

const nextReceiptId = () =>
  'RCP-' + (Finance.payments.reduce((m, p) => Math.max(m, +p.id.slice(4) || 0), 0) + 1);

/**
 * Record a cleared payment and return its receipt number. Finance.payments is
 * the only thing the money figures derive from, so this single push moves the
 * fees table, the dashboard alert, history, receipts, the financial report and
 * the transcript hold together. Nothing is persisted — reloading the page
 * reloads this file, and the account returns to its seeded state.
 */
function recordPayment({ method, amount, against }) {
  const id = nextReceiptId();
  Finance.payments.push({ id, date: TODAY, method, amount, against: against.join(', '), status: 'Cleared' });
  return id;
}

/* Misc helpers shared by the views */
const ALL_SEMESTERS = [SEMESTER_1, SEMESTER_2];
const semesterById = (id) => ALL_SEMESTERS.find((s) => s.id === id) || SEMESTER_2;
/** The semester actually running — what "now" means for the dashboard, which
    reports current state rather than letting you browse terms. */
const activeSemester = () => ALL_SEMESTERS.find((s) => s.status === 'In progress') || ALL_SEMESTERS[ALL_SEMESTERS.length - 1];
const courseByCode = (sem, code) => sem.courses.find((c) => c.code === code);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return d + ' ' + MONTHS[m - 1] + ' ' + y;
}
function fmtDateShort(iso) {
  const [, m, d] = iso.split('-').map(Number);
  return d + ' ' + MONTHS[m - 1];
}
/** Whole days from TODAY to an ISO date; negative means it has passed. */
const TODAY = '2026-08-12';
function daysFrom(iso, from) {
  const a = Date.UTC(...(from || TODAY).split('-').map((n, i) => (i === 1 ? +n - 1 : +n)));
  const b = Date.UTC(...iso.split('-').map((n, i) => (i === 1 ? +n - 1 : +n)));
  return Math.round((b - a) / 86400000);
}
