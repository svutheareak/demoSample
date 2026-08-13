/* ═══════════════════════════════════════════════════════════════════════════
   charts.js — hand-rolled SVG charts, no library.

   Every chart here is SINGLE-SERIES and painted in one hue (--viz-series,
   #ec3013). That is a deliberate constraint: the palette validator puts
   status-good #0ca30c at ΔE 1.7 from the accent under deuteranopia, so a
   multi-hue categorical set built from Modernist's two ramps could not be made
   colourblind-safe. One hue per chart sidesteps the problem entirely — and a
   single series needs no legend, since the title says what is plotted.

   Mark specs follow the house rules: 2px lines, ≥8px markers ringed in the
   surface colour, bars capped at 24px with a 4px rounded data-end square at the
   baseline, hairline solid gridlines, and values labelled selectively.
   ═══════════════════════════════════════════════════════════════════════════ */

const Chart = (() => {

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const round = (n) => Math.round(n * 100) / 100;

  /** Bar path: square at the baseline, 4px rounded at the data end. */
  function barPath(x, y, w, h, r, dir) {
    if (dir === 'h') {
      const rr = Math.min(r, w, h / 2);
      if (w <= 0) return '';
      if (rr <= 0) return `M${x},${y}h${w}v${h}h${-w}Z`;
      return `M${x},${y}H${x + w - rr}A${rr},${rr} 0 0 1 ${x + w},${y + rr}V${y + h - rr}A${rr},${rr} 0 0 1 ${x + w - rr},${y + h}H${x}Z`;
    }
    const rr = Math.min(r, h, w / 2);
    if (h <= 0) return '';
    if (rr <= 0) return `M${x},${y}h${w}v${h}h${-w}Z`;
    return `M${x},${y + h}V${y + rr}A${rr},${rr} 0 0 1 ${x + rr},${y}H${x + w - rr}A${rr},${rr} 0 0 1 ${x + w},${y + rr}V${y + h}Z`;
  }

  /** Clean tick values across a domain. */
  function ticks(min, max, count) {
    const step = (max - min) / count;
    return Array.from({ length: count + 1 }, (_, i) => round(min + step * i));
  }

  /* ── Line chart — change over time, one series ─────────────────────────── */
  function line(opts) {
    const {
      data, yMin = 0, yMax = 4, tickCount = 4, height = 220,
      format = (v) => v.toFixed(2), unit = '', labelLast = true
    } = opts;

    const W = 680, H = height;
    const pad = { l: 40, r: 52, t: 18, b: 32 };
    const iw = W - pad.l - pad.r;
    const ih = H - pad.t - pad.b;
    const n = data.length;

    const px = (i) => pad.l + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
    const py = (v) => pad.t + ih - ((v - yMin) / (yMax - yMin)) * ih;

    const pts = data.map((d, i) => [px(i), py(d.value)]);
    const linePath = pts.map(([x, y], i) => (i ? 'L' : 'M') + round(x) + ',' + round(y)).join(' ');
    const areaPath = linePath + ` L${round(pts[n - 1][0])},${pad.t + ih} L${round(pts[0][0])},${pad.t + ih} Z`;

    const yTicks = ticks(yMin, yMax, tickCount);
    const grid = yTicks.map((t) => {
      const y = round(py(t));
      return `<line class="viz-grid-line" x1="${pad.l}" y1="${y}" x2="${pad.l + iw}" y2="${y}"/>` +
             `<text class="viz-tick" x="${pad.l - 8}" y="${y + 4}" text-anchor="end">${esc(format(t))}</text>`;
    }).join('');

    const xLabels = data.map((d, i) =>
      `<text class="viz-tick" x="${round(px(i))}" y="${pad.t + ih + 20}" text-anchor="middle">${esc(d.label)}</text>`
    ).join('');

    // Markers carry a 2px surface ring; the transparent hit rect in front of
    // each one is the real hover target (a 4px dot is far too small to hit).
    const marks = data.map((d, i) => {
      const [x, y] = pts[i];
      const tip = esc(d.tip || `${d.label} · ${format(d.value)}${unit}`);
      return `<rect class="viz-hit" x="${round(x - iw / (n * 2) - 6)}" y="${pad.t}" width="${round(iw / n + 12)}" height="${ih}" data-tip="${tip}" data-tx="${round(x)}" data-ty="${round(y)}" tabindex="0" role="img" aria-label="${tip}"/>` +
             `<circle class="viz-dot" cx="${round(x)}" cy="${round(y)}" r="4"/>`;
    }).join('');

    // Only the endpoint gets a direct label — a number on every point is noise.
    const last = data[n - 1];
    const endLabel = labelLast
      ? `<text class="viz-label" x="${round(pts[n - 1][0] + 10)}" y="${round(pts[n - 1][1] + 4)}">${esc(format(last.value))}${esc(unit)}</text>`
      : '';

    return `<div class="chart" data-chart>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.aria || 'Line chart')}">
        ${grid}
        <line class="viz-axis-line" x1="${pad.l}" y1="${pad.t + ih}" x2="${pad.l + iw}" y2="${pad.t + ih}"/>
        <path class="viz-area" d="${areaPath}"/>
        <path class="viz-line" d="${linePath}"/>
        ${marks}
        ${endLabel}
        ${xLabels}
      </svg>
      <div class="chart-tip" data-tip-el></div>
    </div>`;
  }

  /* ── Horizontal bars — magnitude across categories, one series ─────────── */
  function bars(opts) {
    const {
      data, max = 100, threshold = null, thresholdLabel = '',
      format = (v) => v.toFixed(0) + '%', labelWidth = 108
    } = opts;

    const W = 680;
    const rowH = 34;          // bar 20px + 14px of air → well past the 2px minimum gap
    const barH = 20;
    const pad = { l: labelWidth, r: 56, t: 6, b: threshold !== null ? 24 : 6 };
    const iw = W - pad.l - pad.r;
    const H = pad.t + data.length * rowH + pad.b;

    const rows = data.map((d, i) => {
      const y = pad.t + i * rowH + (rowH - barH) / 2;
      const w = Math.max(0, (d.value / max) * iw);
      const tip = esc(d.tip || `${d.label} · ${format(d.value)}`);
      return `<text class="viz-tick" x="${pad.l - 10}" y="${round(y + barH / 2 + 4)}" text-anchor="end">${esc(d.label)}</text>` +
             `<path class="viz-bar-track" d="${barPath(pad.l, y, iw, barH, 4, 'h')}" opacity="0.45"/>` +
             `<path class="viz-bar" d="${barPath(pad.l, y, w, barH, 4, 'h')}"/>` +
             `<text class="viz-label" x="${round(pad.l + iw + 10)}" y="${round(y + barH / 2 + 4)}">${esc(format(d.value))}</text>` +
             `<rect class="viz-hit" x="${pad.l}" y="${y - 4}" width="${iw}" height="${barH + 8}" data-tip="${tip}" data-tx="${round(pad.l + w)}" data-ty="${round(y)}" tabindex="0" role="img" aria-label="${tip}"/>`;
    }).join('');

    const line = threshold === null ? '' : (() => {
      const x = round(pad.l + (threshold / max) * iw);
      return `<line class="viz-threshold" x1="${x}" y1="${pad.t - 2}" x2="${x}" y2="${pad.t + data.length * rowH + 2}"/>` +
             `<text class="viz-tick" x="${x}" y="${H - 8}" text-anchor="middle">${esc(thresholdLabel)}</text>`;
    })();

    return `<div class="chart" data-chart>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.aria || 'Bar chart')}">
        ${rows}
        ${line}
      </svg>
      <div class="chart-tip" data-tip-el></div>
    </div>`;
  }

  /* ── Column chart — magnitude over discrete periods ────────────────────── */
  function columns(opts) {
    const { data, max, format = (v) => String(v), height = 200 } = opts;
    const W = 680, H = height;
    const pad = { l: 44, r: 12, t: 20, b: 34 };
    const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
    const top = max || Math.max(...data.map((d) => d.value)) * 1.15 || 1;
    const slot = iw / data.length;
    const barW = Math.min(24, slot - 10);   // capped at 24px; the slot's leftover is air

    const yTicks = ticks(0, top, 4);
    const grid = yTicks.map((t) => {
      const y = round(pad.t + ih - (t / top) * ih);
      return `<line class="viz-grid-line" x1="${pad.l}" y1="${y}" x2="${pad.l + iw}" y2="${y}"/>` +
             `<text class="viz-tick" x="${pad.l - 8}" y="${y + 4}" text-anchor="end">${esc(format(t))}</text>`;
    }).join('');

    const cols = data.map((d, i) => {
      const h = (d.value / top) * ih;
      const x = round(pad.l + slot * i + (slot - barW) / 2);
      const y = round(pad.t + ih - h);
      const tip = esc(d.tip || `${d.label} · ${format(d.value)}`);
      return `<path class="viz-bar" d="${barPath(x, y, barW, h, 4, 'v')}"/>` +
             `<text class="viz-tick" x="${round(x + barW / 2)}" y="${pad.t + ih + 20}" text-anchor="middle">${esc(d.label)}</text>` +
             `<rect class="viz-hit" x="${round(pad.l + slot * i)}" y="${pad.t}" width="${round(slot)}" height="${ih}" data-tip="${tip}" data-tx="${round(x + barW / 2)}" data-ty="${y}" tabindex="0" role="img" aria-label="${tip}"/>`;
    }).join('');

    return `<div class="chart" data-chart>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.aria || 'Column chart')}">
        ${grid}
        <line class="viz-axis-line" x1="${pad.l}" y1="${pad.t + ih}" x2="${pad.l + iw}" y2="${pad.t + ih}"/>
        ${cols}
      </svg>
      <div class="chart-tip" data-tip-el></div>
    </div>`;
  }

  /* ── Sparkline — 12-point trend inside a stat tile ─────────────────────── */
  function sparkline(values) {
    const W = 120, H = 28, p = 3;
    const min = Math.min(...values), max = Math.max(...values);
    const span = max - min || 1;
    const x = (i) => p + (i / (values.length - 1)) * (W - p * 2);
    const y = (v) => H - p - ((v - min) / span) * (H - p * 2);
    const d = values.map((v, i) => (i ? 'L' : 'M') + round(x(i)) + ',' + round(y(v))).join(' ');
    const lx = round(x(values.length - 1)), ly = round(y(values[values.length - 1]));
    // preserveAspectRatio="none" lets the line fill the tile's width; the
    // non-scaling stroke keeps it 2px instead of stretching with the geometry.
    return `<svg class="sparkline" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
      <path d="${d}" vector-effect="non-scaling-stroke"/>
      <circle class="head" cx="${lx}" cy="${ly}" r="3" vector-effect="non-scaling-stroke"/></svg>`;
  }

  /* ── Meter — fill carries severity, track is a lighter step of the ramp ── */
  function meter(pct, opts = {}) {
    const { state = '', valueLabel = null, markAt = null, ariaLabel = '' } = opts;
    const clamped = Math.max(0, Math.min(100, pct));
    const mark = markAt === null ? '' : `<span class="meter-mark" style="left:${round(markAt)}%"></span>`;
    const cls = state ? ' is-' + state : '';
    return `<div class="meter">
      <div class="meter-track" role="img" aria-label="${esc(ariaLabel || clamped.toFixed(0) + '%')}">
        <span class="meter-fill${cls}" style="width:${round(clamped)}%"></span>${mark}
      </div>
      <span class="meter-value">${esc(valueLabel !== null ? valueLabel : clamped.toFixed(0) + '%')}</span>
    </div>`;
  }

  /* ── Tooltips — wired after each render ───────────────────────────────── */
  function attachTips(root) {
    root.querySelectorAll('[data-chart]').forEach((chart) => {
      const tip = chart.querySelector('[data-tip-el]');
      const svg = chart.querySelector('svg');
      if (!tip || !svg) return;

      const show = (hit) => {
        const box = svg.getBoundingClientRect();
        const vb = svg.viewBox.baseVal;
        const sx = box.width / vb.width, sy = box.height / vb.height;
        tip.textContent = hit.dataset.tip;
        tip.style.left = (+hit.dataset.tx * sx) + 'px';
        tip.style.top = (+hit.dataset.ty * sy) + 'px';
        tip.classList.add('is-on');
      };
      const hide = () => tip.classList.remove('is-on');

      chart.querySelectorAll('.viz-hit').forEach((hit) => {
        hit.addEventListener('mouseenter', () => show(hit));
        hit.addEventListener('focus', () => show(hit));
        hit.addEventListener('mouseleave', hide);
        hit.addEventListener('blur', hide);
      });
      chart.addEventListener('mouseleave', hide);
    });
  }

  return { line, bars, columns, sparkline, meter, attachTips };
})();
