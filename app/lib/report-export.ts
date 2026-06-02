import * as XLSX from 'xlsx-js-style';

// ── Types ──────────────────────────────────────────────────────────────────

export interface ReportStat {
  label: string;
  value: string | number;
}

export interface ReportSection {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

// ── PDF ────────────────────────────────────────────────────────────────────

const BADGE_VALS = new Set([
  'critical','high','medium','low',
  'pending','in_progress','in progress','completed','cancelled',
  'open','full','maintenance','closed',
  'active','deleted','approved','rejected','suspended',
]);

function badgeSpan(val: string) {
  const map: Record<string, string> = {
    critical:    'background:#FEF2F2;color:#B91C1C;border:1px solid #FECACA',
    high:        'background:#FFF7ED;color:#C2410C;border:1px solid #FED7AA',
    medium:      'background:#FFFBEB;color:#B45309;border:1px solid #FDE68A',
    low:         'background:#F0FDF4;color:#047857;border:1px solid #BBF7D0',
    pending:     'background:#FFF7ED;color:#C2410C;border:1px solid #FED7AA',
    in_progress: 'background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE',
    'in progress':'background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE',
    completed:   'background:#F0FDF4;color:#047857;border:1px solid #BBF7D0',
    cancelled:   'background:#F3F4F6;color:#374151;border:1px solid #E5E7EB',
    open:        'background:#F0FDF4;color:#047857;border:1px solid #BBF7D0',
    full:        'background:#FEF2F2;color:#B91C1C;border:1px solid #FECACA',
    maintenance: 'background:#FFF7ED;color:#C2410C;border:1px solid #FED7AA',
    closed:      'background:#F3F4F6;color:#374151;border:1px solid #E5E7EB',
    active:      'background:#F0FDF4;color:#047857;border:1px solid #BBF7D0',
    deleted:     'background:#FEF2F2;color:#B91C1C;border:1px solid #FECACA',
    approved:    'background:#F0FDF4;color:#047857;border:1px solid #BBF7D0',
    rejected:    'background:#FEF2F2;color:#B91C1C;border:1px solid #FECACA',
    suspended:   'background:#FEF3C7;color:#92400E;border:1px solid #FDE68A',
  };
  const style = map[val.toLowerCase().replace(/\s+/g, '_')] ?? 'background:#F3F4F6;color:#374151;border:1px solid #E5E7EB';
  return `<span style="${style};padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600;text-transform:capitalize">${val}</span>`;
}

function renderCell(val: string) {
  const key = val.toLowerCase().replace(/\s+/g, '_');
  return BADGE_VALS.has(key) ? badgeSpan(val) : val;
}

export function buildReportHtml(opts: {
  title: string;
  subtitle?: string;
  timestamp: string;
  stats?: ReportStat[];
  sections: ReportSection[];
}): string {
  const { title, subtitle, timestamp, stats, sections } = opts;

  const statsHtml = stats && stats.length > 0
    ? `<div class="section">
        <div class="section-title">Overview Statistics</div>
        <div class="stats">${stats.map(s =>
          `<div class="stat"><div class="stat-value">${s.value}</div><div class="stat-label">${s.label}</div></div>`
        ).join('')}</div>
      </div>`
    : '';

  const sectionsHtml = sections.map(s => `
    <div class="section">
      <div class="section-title">${s.title}</div>
      <table>
        <thead><tr>${s.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${s.rows.length > 0
          ? s.rows.map(row => `<tr>${row.map(cell => `<td>${renderCell(String(cell))}</td>`).join('')}</tr>`).join('')
          : `<tr class="empty-row"><td colspan="${s.headers.length}">No data available</td></tr>`
        }</tbody>
      </table>
    </div>`
  ).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; }
    @media screen {
      html { background: #E5E7EB; min-height: 100%; padding: 32px 0; }
      body { width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; box-shadow: 0 4px 24px rgba(0,0,0,0.15); }
      .page { padding: 18mm 20mm; }
    }
    @media print {
      html, body { background: #fff; width: 100%; margin: 0; box-shadow: none; }
      .page { padding: 18mm 20mm; }
    }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111827; line-height: 1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .header { background: #111827; color: #fff; padding: 18px 22px 14px; margin-bottom: 18px; }
    .header h1 { margin: 0 0 4px; font-size: 20px; font-weight: 700; letter-spacing: -0.3px; }
    .header p  { margin: 0; font-size: 10px; color: #9CA3AF; }
    .section { margin-bottom: 20px; page-break-inside: avoid; }
    .section-title { background: #374151; color: #fff; padding: 6px 10px; font-size: 11px; font-weight: 700; margin: 0; letter-spacing: 0.2px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); border: 1px solid #E5E7EB; border-top: none; }
    .stat { padding: 12px 14px; border-right: 1px solid #E5E7EB; }
    .stat:last-child { border-right: none; }
    .stat-value { font-size: 22px; font-weight: 700; color: #111827; line-height: 1.2; }
    .stat-label { font-size: 10px; color: #6B7280; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; border: 1px solid #E5E7EB; border-top: none; }
    thead tr { background: #1F2937; }
    thead th { color: #fff; font-weight: 700; padding: 7px 8px; text-align: left; border-right: 1px solid #374151; }
    thead th:last-child { border-right: none; }
    tbody tr:nth-child(even) { background: #F9FAFB; }
    tbody tr:nth-child(odd)  { background: #ffffff; }
    tbody td { padding: 6px 8px; border-right: 1px solid #F3F4F6; border-bottom: 1px solid #F3F4F6; color: #111827; vertical-align: middle; }
    tbody td:last-child { border-right: none; }
    .empty-row td { text-align: center; color: #9CA3AF; padding: 14px; font-style: italic; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>${title}</h1>
      <p>${subtitle ? subtitle + ' &nbsp;·&nbsp; ' : ''}Generated on: ${timestamp}</p>
    </div>
    ${statsHtml}
    ${sectionsHtml}
  </div>
</body>
</html>`;
}

export function openPrintWindow(html: string) {
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  }
}

// ── Excel ──────────────────────────────────────────────────────────────────

const XS = {
  title:      { font: { bold: true, sz: 16, color: { rgb: 'FFFFFFFF' } }, fill: { fgColor: { rgb: 'FF111827' } }, alignment: { horizontal: 'left', vertical: 'center' } },
  subtitle:   { font: { sz: 10, color: { rgb: 'FF6B7280' } }, fill: { fgColor: { rgb: 'FFFFFFFF' } }, alignment: { horizontal: 'left' } },
  sectionHdr: { font: { bold: true, sz: 11, color: { rgb: 'FFFFFFFF' } }, fill: { fgColor: { rgb: 'FF374151' } }, alignment: { horizontal: 'left', vertical: 'center' } },
  colHeader:  { font: { bold: true, sz: 10, color: { rgb: 'FFFFFFFF' } }, fill: { fgColor: { rgb: 'FF1F2937' } }, alignment: { horizontal: 'left', vertical: 'center' }, border: { bottom: { style: 'thin', color: { rgb: 'FF4B5563' } } } },
  statLabel:  { font: { bold: true, sz: 10, color: { rgb: 'FF374151' } }, fill: { fgColor: { rgb: 'FFF3F4F6' } }, alignment: { horizontal: 'left', vertical: 'center' } },
  statValue:  { font: { bold: true, sz: 13, color: { rgb: 'FF111827' } }, fill: { fgColor: { rgb: 'FFF3F4F6' } }, alignment: { horizontal: 'left', vertical: 'center' } },
  rowEven:    { font: { sz: 10, color: { rgb: 'FF111827' } }, fill: { fgColor: { rgb: 'FFFFFFFF' } }, alignment: { horizontal: 'left', vertical: 'center' } },
  rowOdd:     { font: { sz: 10, color: { rgb: 'FF111827' } }, fill: { fgColor: { rgb: 'FFF9FAFB' } }, alignment: { horizontal: 'left', vertical: 'center' } },
  empty:      { fill: { fgColor: { rgb: 'FFFFFFFF' } } },
} as const;

export function buildExcelReport(opts: {
  title: string;
  filename: string;
  timestamp: string;
  stats?: ReportStat[];
  sections: ReportSection[];
  colWidths?: number[];
}) {
  const { title, filename, timestamp, stats, sections, colWidths } = opts;

  const maxCols = Math.max(
    ...sections.map(s => s.headers.length),
    stats ? Math.ceil((stats.length / 2)) * 2 + 2 : 2,
    2,
  );

  const ws: XLSX.WorkSheet = {};
  let r = 0;

  const blank = () => ({ v: '', t: 's' as const, s: XS.empty });
  const cell = (v: string | number, s: object) => ({ v, t: (typeof v === 'number' ? 'n' : 's') as 'n' | 's', s });

  const fillRow = (cols: ReturnType<typeof cell | typeof blank>[]) => {
    for (let i = 0; i < maxCols; i++) {
      ws[XLSX.utils.encode_cell({ r, c: i })] = cols[i] ?? blank();
    }
    r++;
  };

  // Header block
  fillRow([cell(title, XS.title)]);
  fillRow([cell(`Generated on: ${timestamp}`, XS.subtitle)]);
  fillRow([blank()]);

  // Stats — 2 pairs per row: [label, value, gap, label, value]
  if (stats && stats.length > 0) {
    fillRow([cell('Overview Statistics', XS.sectionHdr)]);
    for (let i = 0; i < stats.length; i += 2) {
      const a = stats[i];
      const b = stats[i + 1];
      fillRow([
        cell(a.label, XS.statLabel), cell(a.value, XS.statValue), blank(),
        ...(b ? [cell(b.label, XS.statLabel), cell(b.value, XS.statValue)] : [blank(), blank()]),
      ]);
    }
    fillRow([blank()]);
  }

  // Data sections
  for (const section of sections) {
    fillRow([cell(section.title, XS.sectionHdr)]);
    fillRow(section.headers.map(h => cell(h, XS.colHeader)));
    if (section.rows.length > 0) {
      section.rows.forEach((row, i) => {
        const base = i % 2 === 0 ? XS.rowEven : XS.rowOdd;
        fillRow(row.map(v => cell(v, base)));
      });
    } else {
      fillRow([blank(), cell('No data available', XS.rowEven)]);
    }
    fillRow([blank()]);
  }

  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: r - 1, c: maxCols - 1 } });
  ws['!cols'] = colWidths
    ? colWidths.map(w => ({ wch: w }))
    : Array.from({ length: maxCols }, (_, i) => ({ wch: i === 0 ? 28 : i === 1 ? 32 : 18 }));
  ws['!rows'] = Array.from({ length: r }, (_, i) => (i === 0 ? { hpt: 28 } : { hpt: 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, filename);
}
