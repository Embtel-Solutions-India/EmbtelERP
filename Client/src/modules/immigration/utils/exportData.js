/**
 * Dependency-free export helpers for the immigration reports module.
 * - CSV download (Excel-compatible via UTF-8 BOM)
 * - Print / PDF via a clean printable window (user chooses "Save as PDF")
 *
 * No new packages required — uses Blob + the browser print pipeline.
 */

function escapeCsvCell(val) {
  if (val == null) return ''
  const s = String(val)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * Build a CSV string from column defs + rows.
 * @param {Array<{key:string,label:string}>} columns
 * @param {Array<object>} rows
 */
export function buildCsv(columns, rows) {
  const head = columns.map(c => escapeCsvCell(c.label)).join(',')
  const body = rows
    .map(r => columns.map(c => escapeCsvCell(r[c.key])).join(','))
    .join('\n')
  return `${head}\n${body}`
}

/** Trigger a browser download of a CSV string (BOM prefixed for Excel). */
export function downloadCsv(filename, csv) {
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Convenience: build + download in one call. */
export function exportCsv(filename, columns, rows) {
  downloadCsv(filename, buildCsv(columns, rows))
}

const escHtml = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]),
  )

/**
 * Open a clean, print-friendly window for the report and trigger print.
 * The user can "Save as PDF" from the browser print dialog.
 * @param {string} title
 * @param {Array<{heading:string, columns:Array<{key,label}>, rows:Array<object>}>} sections
 */
export function openPrintView(title, sections) {
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) return // popup blocked

  const tables = sections
    .filter(s => s.rows && s.rows.length)
    .map(s => {
      const head = s.columns.map(c => `<th>${escHtml(c.label)}</th>`).join('')
      const body = s.rows
        .map(r => `<tr>${s.columns.map(c => `<td>${escHtml(r[c.key])}</td>`).join('')}</tr>`)
        .join('')
      return `
        <h2>${escHtml(s.heading)}</h2>
        <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
    })
    .join('')

  win.document.write(`<!doctype html><html><head><meta charset="utf-8" />
    <title>${escHtml(title)}</title>
    <style>
      * { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
      body { margin: 32px; color: #1f2937; }
      h1 { font-size: 20px; margin: 0 0 4px; }
      .meta { color: #6b7280; font-size: 12px; margin-bottom: 24px; }
      h2 { font-size: 14px; margin: 24px 0 8px; color: #4338ca; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 8px; }
      th, td { text-align: left; padding: 6px 10px; border-bottom: 1px solid #e5e7eb; }
      th { background: #f3f4f6; text-transform: uppercase; font-size: 10px; letter-spacing: .04em; color: #6b7280; }
      @media print { body { margin: 12px; } }
    </style></head><body>
    <h1>${escHtml(title)}</h1>
    <div class="meta">Generated ${escHtml(new Date().toLocaleString())}</div>
    ${tables || '<p>No data available.</p>'}
    <script>window.onload = () => { window.print(); }<\/script>
  </body></html>`)
  win.document.close()
}
