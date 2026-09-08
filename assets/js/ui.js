/* ═══════════════════════════════════════════════════════════════════════════
   ui.js — shared presentation primitives.

   Views compose these; none of them holds state. Status badges always pair a
   glyph with a text label, so meaning never rests on hue alone.
   ═══════════════════════════════════════════════════════════════════════════ */

const UI = (() => {

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ── Icons (lucide geometry) ───────────────────────────────────────────── */
  const ICONS = {
    dashboard: [['rect',{width:7,height:9,x:3,y:3,rx:1}],['rect',{width:7,height:5,x:14,y:3,rx:1}],['rect',{width:7,height:9,x:14,y:12,rx:1}],['rect',{width:7,height:5,x:3,y:16,rx:1}]],
    'book-open': [['path',{d:'M12 7v14'}],['path',{d:'M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z'}]],
    calendar: [['path',{d:'M8 2v4'}],['path',{d:'M16 2v4'}],['rect',{width:18,height:18,x:3,y:4,rx:2}],['path',{d:'M3 10h18'}]],
    layers: [['path',{d:'m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z'}],['path',{d:'M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12'}],['path',{d:'M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17'}]],
    book: [['path',{d:'M4 19.5A2.5 2.5 0 0 1 6.5 17H20'}],['path',{d:'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'}]],
    'clipboard-check': [['rect',{width:8,height:4,x:8,y:2,rx:1}],['path',{d:'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'}],['path',{d:'m9 14 2 2 4-4'}]],
    award: [['path',{d:'m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526'}],['circle',{cx:12,cy:8,r:6}]],
    'file-text': [['path',{d:'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z'}],['path',{d:'M14 2v4a2 2 0 0 0 2 2h4'}],['path',{d:'M10 9H8'}],['path',{d:'M16 13H8'}],['path',{d:'M16 17H8'}]],
    'trending-up': [['path',{d:'M16 7h6v6'}],['path',{d:'m22 7-8.5 8.5-5-5L2 17'}]],
    'credit-card': [['rect',{width:20,height:14,x:2,y:5,rx:2}],['line',{x1:2,x2:22,y1:10,y2:10}]],
    receipt: [['path',{d:'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z'}],['path',{d:'M8 7h8'}],['path',{d:'M8 11h8'}],['path',{d:'M8 15h5'}]],
    clock: [['circle',{cx:12,cy:12,r:10}],['polyline',{points:'12 6 12 12 16 14'}]],
    gift: [['rect',{x:3,y:8,width:18,height:4,rx:1}],['path',{d:'M12 8v13'}],['path',{d:'M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7'}],['path',{d:'M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8Z'}],['path',{d:'M16.5 8a2.5 2.5 0 0 0 0-5C13 3 12 8 12 8Z'}]],
    'bar-chart': [['path',{d:'M3 3v18h18'}],['path',{d:'M18 17V9'}],['path',{d:'M13 17V5'}],['path',{d:'M8 17v-3'}]],
    'clipboard-list': [['rect',{width:8,height:4,x:8,y:2,rx:1}],['path',{d:'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'}],['path',{d:'M12 11h4'}],['path',{d:'M12 16h4'}],['path',{d:'M8 11h.01'}],['path',{d:'M8 16h.01'}]],
    'pie-chart': [['path',{d:'M21.21 15.89A10 10 0 1 1 8 2.83'}],['path',{d:'M22 12A10 10 0 0 0 12 2v10z'}]],
    wrench: [['path',{d:'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z'}]],
    monitor: [['rect',{width:20,height:14,x:2,y:3,rx:2}],['line',{x1:8,x2:16,y1:21,y2:21}],['line',{x1:12,x2:12,y1:17,y2:21}]],
    'message-circle': [['path',{d:'M7.9 20A9 9 0 1 0 4 16.1L2 22Z'}]],
    map: [['path',{d:'M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z'}],['path',{d:'M15 5.764v15'}],['path',{d:'M9 3.236v15'}]],
    download: [['path',{d:'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'}],['polyline',{points:'7 10 12 15 17 10'}],['line',{x1:12,x2:12,y1:15,y2:3}]],
    menu: [['line',{x1:4,x2:20,y1:6,y2:6}],['line',{x1:4,x2:20,y1:12,y2:12}],['line',{x1:4,x2:20,y1:18,y2:18}]],
    'arrow-right': [['path',{d:'M5 12h14'}],['path',{d:'m12 5 7 7-7 7'}]],
    banknote: [['rect',{width:20,height:12,x:2,y:6,rx:2}],['circle',{cx:12,cy:12,r:2}],['path',{d:'M6 12h.01'}],['path',{d:'M18 12h.01'}]],
    x: [['path',{d:'M18 6 6 18'}],['path',{d:'m6 6 12 12'}]],
    'check-circle': [['circle',{cx:12,cy:12,r:10}],['path',{d:'m9 12 2 2 4-4'}]],
    'alert-circle': [['circle',{cx:12,cy:12,r:10}],['line',{x1:12,x2:12,y1:8,y2:12}],['line',{x1:12,x2:12.01,y1:16,y2:16}]],
    'alert-triangle': [['path',{d:'m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3'}],['path',{d:'M12 9v4'}],['path',{d:'M12 17h.01'}]],
    'external-link': [['path',{d:'M15 3h6v6'}],['path',{d:'M10 14 21 3'}],['path',{d:'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'}]]
  };

  function icon(key, size = 16) {
    const parts = ICONS[key] || ICONS.dashboard;
    const inner = parts.map(([tag, attrs]) =>
      '<' + tag + ' ' + Object.entries(attrs).map(([k, v]) => k + '="' + v + '"').join(' ') + '/>'
    ).join('');
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  }

  /* ── Page furniture ────────────────────────────────────────────────────── */
  function pageHead({ kicker, title, lead, actions }) {
    return `<header class="page-head">
      <div class="page-head-row">
        <div>
          ${kicker ? `<p class="kicker">${esc(kicker)}</p>` : ''}
          <h1>${esc(title)}</h1>
        </div>
        ${actions ? `<div class="page-actions no-print">${actions}</div>` : ''}
      </div>
      ${lead ? `<p>${esc(lead)}</p>` : ''}
    </header>`;
  }

  function card(body, opts = {}) {
    const { title, subtitle, aside, className = '' } = opts;
    const head = title
      ? `<div class="card-head"><div><h4>${esc(title)}</h4>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div>${aside || ''}</div>`
      : '';
    return `<section class="card ${className}">${head}${body}</section>`;
  }

  function table({ head, rows, foot, className = '' }) {
    return `<div class="table-wrap"><table class="table ${className}">
      <thead><tr>${head.map((h) => `<th${h.right ? ' class="right"' : ''}>${esc(h.label !== undefined ? h.label : h)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${r.map((c) => (typeof c === 'string' ? `<td>${c}</td>` : `<td class="${c.cls || ''}">${c.html}</td>`)).join('')}</tr>`).join('')}</tbody>
      ${foot ? `<tfoot><tr>${foot.map((c) => (typeof c === 'string' ? `<td>${c}</td>` : `<td class="${c.cls || ''}">${c.html}</td>`)).join('')}</tr></tfoot>` : ''}
    </table></div>`;
  }

  function empty(title, text) {
    return `<div class="empty"><h4>${esc(title)}</h4><p class="text-small">${esc(text)}</p></div>`;
  }

  function statTile({ label, value, unit, foot, spark, footState }) {
    return `<div class="stat">
      <span class="stat-label">${esc(label)}</span>
      <span class="stat-value">${esc(value)}${unit ? `<span class="unit">${esc(unit)}</span>` : ''}</span>
      ${foot ? `<span class="stat-foot${footState ? ' ' + footState : ''}">${foot}</span>` : ''}
      ${spark ? `<div class="stat-spark">${spark}</div>` : ''}
    </div>`;
  }

  /* ── Badges — glyph + label, every time ────────────────────────────────── */
  const GLYPH = { good: '✓', warning: '!', critical: '×', neutral: '·', accent: '•' };
  function badge(state, label) {
    const kind = ['good', 'warning', 'critical', 'accent'].includes(state) ? state : 'neutral';
    const cls = kind === 'neutral' ? '' : ' badge-' + kind;
    return `<span class="badge${cls}"><span class="glyph" aria-hidden="true">${GLYPH[kind]}</span>${esc(label)}</span>`;
  }

  /** Letter grade → badge state. C and below reads as a warning, F as critical. */
  function gradeBadge(letter) {
    if (letter === '—') return badge('neutral', 'Not graded');
    const state = letter === 'F' ? 'critical' : /^(C|D)/.test(letter) ? 'warning' : 'good';
    return badge(state, letter);
  }

  function attendanceBadge(rate) {
    if (rate >= 0.9) return badge('good', 'Good');
    if (rate >= ATTENDANCE_THRESHOLD) return badge('warning', 'Watch');
    return badge('critical', 'Below 75%');
  }

  function payBadge(state) {
    if (state === 'Paid') return badge('good', 'Paid');
    if (state === 'Part paid') return badge('warning', 'Part paid');
    return badge('critical', 'Unpaid');
  }

  function statusBadge(text) {
    const good = ['Cleared', 'Issued', 'Completed', 'Ready for collection', 'Active', 'Awarded', 'Submitted', 'Good standing'];
    const warn = ['Pending', 'In progress', 'Under review', 'Draft saved', 'Not started'];
    if (good.includes(text)) return badge('good', text);
    if (warn.includes(text)) return badge('warning', text);
    return badge('neutral', text);
  }

  /* ── Site-map tree (recursive — any depth) ─────────────────────────────── */
  const CHEVRON = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';

  function treeNode(node, depth) {
    const bullets = node.bullets || [];
    const kids = node.kids || [];
    const hasBody = bullets.length > 0 || kids.length > 0;
    const tag = hasBody ? 'button' : 'div';
    const row = `<${tag} class="row"${hasBody ? ' type="button" aria-expanded="true"' : ''}>` +
      `<span class="chev">${hasBody ? CHEVRON : ''}</span>` +
      `<span class="ico">${icon(node.iconKey, depth === 0 ? 20 : 16)}</span>` +
      `<span class="label">${esc(node.label)}</span></${tag}>`;
    const body = hasBody
      ? '<div class="body">' +
        (bullets.length ? `<ul class="bullets">${bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : '') +
        (kids.length ? `<div class="kids">${kids.map((k) => treeNode(k, depth + 1)).join('')}</div>` : '') +
        '</div>'
      : '';
    return `<div class="node" data-depth="${depth}"${hasBody ? ' data-open="true"' : ''}>${row}${body}</div>`;
  }

  function tree(branches) {
    return `<div class="tree-columns" data-tree>${branches
      .map((b) => `<div class="tree-col">${treeNode(b, 0)}</div>`).join('')}</div>`;
  }

  /* ── Toasts ───────────────────────────────────────────────────────────── */
  /* Transient status for the actions that would hit a server. Each toast owns
     its role — status for a success, alert for a failure — so the two get the
     politeness they deserve without a shared region having to pick one. The
     role sits on an inner wrapper so the close button's label is not read out
     as part of the message.

     On the auto-dismiss: a countdown the user cannot control is a 2.2.1 (Timing
     Adjustable) concern, so three things hold here. The timer pauses while the
     toast is hovered or focused; every toast has a close button; and nothing is
     announced ONLY in a toast — the button label and the page state carry the
     same outcome after it has gone, so a missed toast loses no information.
     Set TOAST_MS to 0 to turn auto-dismiss off entirely. */
  const TOAST_MS = 3000;
  const TOAST_MAX = 4;      // cap the stack; oldest goes first

  function toast(message, opts = {}) {
    const { status = 'success', duration = TOAST_MS } = opts;
    const host = document.getElementById('toasts');
    if (!host) return null;

    while (host.children.length >= TOAST_MAX) host.firstElementChild.remove();

    const ok = status !== 'error';
    const node = document.createElement('div');
    node.className = 'toast is-' + (ok ? 'success' : 'error');
    node.innerHTML =
      `<div class="toast-live" role="${ok ? 'status' : 'alert'}">
         <span class="toast-icon">${icon(ok ? 'check-circle' : 'alert-circle', 18)}</span>
         <p class="toast-msg">${esc(message)}</p>
       </div>
       <button class="toast-close" type="button" aria-label="Dismiss this message">${icon('x', 14)}</button>`;

    let timer = null;
    const stop = () => clearTimeout(timer);
    const close = () => {
      stop();
      if (!node.parentNode) return;
      node.classList.add('is-leaving');
      const done = () => node.remove();
      node.addEventListener('transitionend', done, { once: true });
      setTimeout(done, 300);        // fallback when transitions are off
    };
    const start = () => { if (duration > 0) timer = setTimeout(close, duration); };

    node.querySelector('.toast-close').addEventListener('click', close);
    // Pause the countdown while the message is being read or reached (2.2.1).
    node.addEventListener('mouseenter', stop);
    node.addEventListener('mouseleave', start);
    node.addEventListener('focusin', stop);
    node.addEventListener('focusout', start);

    host.appendChild(node);
    requestAnimationFrame(() => node.classList.add('is-in'));
    start();
    return node;
  }

  /* Print and download buttons. data-print names what is being produced, so a
     single handler serves every page; data-print-blocked, where present, is the
     reason the action is unavailable — a button held open with aria-disabled
     can say why it will not act, which a dead disabled button cannot. */
  function wirePrint(root) {
    root.querySelectorAll('[data-print]').forEach((b) => {
      b.addEventListener('click', () => {
        if (b.getAttribute('aria-disabled') === 'true') {
          if (b.dataset.printBlocked) toast(b.dataset.printBlocked, { status: 'error' });
          return;
        }
        window.print();
        toast((b.dataset.print || 'Document') + ' sent to your print dialog.');
      });
    });
  }

  /* Write a status message into the polite live region (4.1.3). Only for
     things that change after the page has settled without focus moving —
     announcing static content just makes the page noisier. */
  function announce(msg) {
    const live = document.getElementById('live');
    if (live) live.textContent = msg;
  }

  function attachTree(root) {
    root.querySelectorAll('[data-tree]').forEach((treeEl) => {
      treeEl.addEventListener('click', (e) => {
        const row = e.target.closest('button.row');
        if (!row || !treeEl.contains(row)) return;
        const node = row.parentElement;
        const open = node.dataset.open !== 'true';
        node.dataset.open = String(open);
        row.setAttribute('aria-expanded', String(open));
      });
    });
  }

  return { esc, icon, pageHead, card, table, empty, statTile, badge, gradeBadge,
           attendanceBadge, payBadge, statusBadge, tree, attachTree, announce, toast, wirePrint };
})();
